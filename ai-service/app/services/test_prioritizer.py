from datetime import datetime, timedelta, timezone

from app.services.prioritizer import prioritize, score_task

NOW = datetime(2024, 5, 28, 9, 0, tzinfo=timezone.utc)


def task(**overrides):
    base = {"id": "t1", "title": "Task", "priority": "medium", "status": "todo"}
    base.update(overrides)
    return base


def test_overdue_tasks_score_high():
    overdue = score_task(task(due_date=(NOW - timedelta(days=2)).isoformat()), NOW)
    fresh = score_task(task(due_date=(NOW + timedelta(days=10)).isoformat()), NOW)

    assert overdue["bucket"] == "high"
    assert "overdue" in overdue["reason"]
    assert overdue["score"] > fresh["score"]


def test_due_today_beats_due_next_week():
    today = score_task(task(due_date=NOW.isoformat()), NOW)
    later = score_task(task(due_date=(NOW + timedelta(days=7)).isoformat()), NOW)

    assert "due today" in today["reason"]
    assert today["score"] > later["score"]


def test_priority_weight_matters_without_dates():
    high = score_task(task(priority="high"), NOW)
    low = score_task(task(priority="low"), NOW)

    assert high["score"] > low["score"]


def test_in_progress_gets_a_bump():
    idle = score_task(task(), NOW)
    started = score_task(task(status="in_progress"), NOW)

    assert "already in progress" in started["reason"]
    assert started["score"] > idle["score"]


def test_stale_tasks_get_noticed():
    fresh = score_task(task(created_at=NOW.isoformat()), NOW)
    stale = score_task(task(created_at=(NOW - timedelta(days=30)).isoformat()), NOW)

    assert "open for 30d" in stale["reason"]
    assert stale["score"] > fresh["score"]


def test_prioritize_orders_by_score():
    tasks = [
        task(id="low", priority="low"),
        task(id="overdue", due_date=(NOW - timedelta(days=1)).isoformat()),
        task(id="urgent", priority="high", due_date=NOW.isoformat()),
    ]

    result = prioritize(tasks, now=NOW)

    assert [item["id"] for item in result] == ["urgent", "overdue", "low"]
    assert result[0]["bucket"] == "high"
