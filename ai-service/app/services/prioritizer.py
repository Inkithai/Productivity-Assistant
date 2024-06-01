"""Rank open tasks so the assistant can answer "what should I focus on?".

Scoring is deliberately transparent: every point contributes to the `reason`
string that ships with the result, which keeps the recommendations debuggable.
"""

from datetime import datetime, timezone

PRIORITY_WEIGHTS = {"high": 30, "medium": 18, "low": 8}

HIGH_BUCKET = 45
MEDIUM_BUCKET = 25


def _parse_dt(value):
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def score_task(task, now):
    score = PRIORITY_WEIGHTS.get(task.get("priority"), 18)
    reasons = []

    due = _parse_dt(task.get("due_date"))
    if due is not None:
        days = (due - now).days
        if days < 0:
            score += min(40, 20 + abs(days) * 4)
            reasons.append(f"overdue by {abs(days)}d")
        elif days == 0:
            score += 20
            reasons.append("due today")
        elif days == 1:
            score += 14
            reasons.append("due tomorrow")
        elif days <= 3:
            score += 8
            reasons.append(f"due in {days}d")
    else:
        score -= 2

    if task.get("status") == "in_progress":
        score += 6
        reasons.append("already in progress")

    created = _parse_dt(task.get("created_at"))
    if created is not None:
        age_days = (now - created).days
        if age_days > 14:
            score += 5
            reasons.append(f"open for {age_days}d")

    score = max(0, min(100, score))
    if score >= HIGH_BUCKET:
        bucket = "high"
    elif score >= MEDIUM_BUCKET:
        bucket = "medium"
    else:
        bucket = "low"

    return {
        "id": task.get("id"),
        "title": task.get("title"),
        "score": score,
        "bucket": bucket,
        "reason": ", ".join(reasons) if reasons else "routine work",
    }


def prioritize(tasks, now=None):
    now = now or datetime.now(timezone.utc)
    suggestions = [score_task(task, now) for task in tasks]
    suggestions.sort(key=lambda item: item["score"], reverse=True)
    return suggestions
