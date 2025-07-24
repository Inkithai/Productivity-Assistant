from datetime import datetime, timedelta, timezone

from app.services.llm_client import LLMError
from app.services.planner import plan_day

NOW = datetime(2025, 7, 24, 8, 0, tzinfo=timezone.utc)


class _Disabled:
    enabled = False
    openai_api_key = None
    openai_base_url = ""
    openai_model = ""
    llm_timeout_seconds = 5.0


def task(**overrides):
    base = {"id": "t1", "title": "Task", "priority": "medium", "status": "todo"}
    base.update(overrides)
    return base


def test_empty_task_list_returns_free_day():
    result = plan_day([], client=_Disabled())
    assert result["blocks"] == []
    assert result["focus_minutes"] == 0
    assert "yours" in result["note"]


def test_blocks_are_back_to_back_with_breaks():
    tasks = [
        task(id="a", title="First", priority="high"),
        task(id="b", title="Second", priority="medium"),
        task(id="c", title="Third", priority="low"),
    ]

    result = plan_day(tasks, start_hour=9, client=_Disabled(), now=NOW)

    assert result["provider"] == "rules"
    assert len(result["blocks"]) == 3
    assert result["blocks"][0]["start"] == "09:00"
    # 50 minute block, 10 minute break, next block
    assert result["blocks"][0]["end"] == "09:50"
    assert result["blocks"][1]["start"] == "10:00"
    assert result["focus_minutes"] == 150


def test_highest_priority_work_comes_first():
    tasks = [
        task(id="low", title="Tidy desk", priority="low"),
        task(id="urgent", title="Fix outage", priority="high", due_date=NOW.isoformat()),
    ]

    result = plan_day(tasks, client=_Disabled(), now=NOW)

    assert result["blocks"][0]["title"] == "Fix outage"


def test_respects_max_blocks():
    tasks = [task(id=str(i), title=f"Task {i}", priority="high") for i in range(10)]
    result = plan_day(tasks, max_blocks=3, client=_Disabled(), now=NOW)
    assert len(result["blocks"]) == 3


def test_clamps_unreasonable_start_hours():
    tasks = [task(title="Only one")]
    result = plan_day(tasks, start_hour=30, client=_Disabled(), now=NOW)
    assert result["blocks"][0]["start"] == "23:00"


class _JsonClient:
    enabled = True

    def chat(self, *args, **kwargs):
        return (
            '{"blocks": [{"title": "Deep work", "start": "09:00", "end": "10:30", '
            '"reason": "hardest first"}], "focus_minutes": 90}'
        )


def test_llm_plan_passes_through_when_valid():
    result = plan_day([task(title="Anything")], client=_JsonClient(), now=NOW)

    assert result["provider"] == "openai"
    assert result["blocks"][0]["title"] == "Deep work"
    assert result["focus_minutes"] == 90


class _BrokenClient:
    enabled = True

    def chat(self, *args, **kwargs):
        raise LLMError("provider down")


def test_llm_failure_falls_back_to_rules():
    result = plan_day([task(title="Fallback work")], client=_BrokenClient(), now=NOW)

    assert result["provider"] == "rules"
    assert result["blocks"][0]["title"] == "Fallback work"
