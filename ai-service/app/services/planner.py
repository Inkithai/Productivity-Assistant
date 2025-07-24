"""Build a time-blocked plan for the day from open tasks."""

import logging

from app.services.llm_client import LLMClient, LLMError
from app.services.prioritizer import prioritize

logger = logging.getLogger(__name__)

WORK_BLOCK_MINUTES = 50
BREAK_MINUTES = 10
DEFAULT_START_HOUR = 9
MAX_BLOCKS = 5

SYSTEM_PROMPT = (
    "You are a day planner. Reply with a single JSON object: "
    '{"blocks": [{"title": str, "start": "HH:MM", "end": "HH:MM", '
    '"reason": str}], "focus_minutes": int}. Blocks run back to back with '
    "short breaks and must not exceed the requested number."
)


def _fmt(minutes):
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def _rules_plan(tasks, start_hour, max_blocks, now):
    ranked = prioritize(tasks, now=now)[:max_blocks]
    blocks = []
    cursor = start_hour * 60

    for position, item in enumerate(ranked):
        end = cursor + WORK_BLOCK_MINUTES
        blocks.append(
            {
                "title": item["title"] or "Untitled",
                "start": _fmt(cursor),
                "end": _fmt(end),
                "reason": item["reason"],
            }
        )
        cursor = end + (BREAK_MINUTES if position < len(ranked) - 1 else 0)

    return {"blocks": blocks, "focus_minutes": len(blocks) * WORK_BLOCK_MINUTES}


def _llm_plan(tasks, start_hour, max_blocks, client, now):
    task_lines = "\n".join(
        f"- {task.get('title')} (priority {task.get('priority', 'medium')}, "
        f"due {task.get('due_date') or 'no date'})"
        for task in tasks[:15]
    )
    raw = client.chat(
        [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Plan at most {max_blocks} blocks starting at "
                    f"{_fmt(start_hour * 60)}.\nOpen tasks:\n{task_lines}"
                ),
            },
        ],
        json_mode=True,
        temperature=0.2,
    )
    import json

    data = json.loads(raw)
    blocks = data.get("blocks") or []
    if not blocks or not isinstance(blocks, list):
        raise LLMError("planner returned no blocks")

    cleaned = []
    for block in blocks[:max_blocks]:
        if not block.get("title") or not block.get("start") or not block.get("end"):
            continue
        cleaned.append(
            {
                "title": str(block["title"])[:200],
                "start": str(block["start"])[:5],
                "end": str(block["end"])[:5],
                "reason": str(block.get("reason", ""))[:200],
            }
        )
    if not cleaned:
        raise LLMError("planner blocks were incomplete")
    return {
        "blocks": cleaned,
        "focus_minutes": int(data.get("focus_minutes") or len(cleaned) * WORK_BLOCK_MINUTES),
    }


def plan_day(tasks, start_hour=DEFAULT_START_HOUR, max_blocks=MAX_BLOCKS, now=None, client=None):
    client = client or LLMClient()
    start_hour = max(0, min(23, int(start_hour)))
    max_blocks = max(1, min(8, int(max_blocks)))

    if not tasks:
        return {
            "blocks": [],
            "focus_minutes": 0,
            "provider": "rules",
            "note": "No open tasks — the day is yours.",
        }

    if client.enabled:
        try:
            result = _llm_plan(tasks, start_hour, max_blocks, client, now)
            result["provider"] = "openai"
            return result
        except (LLMError, ValueError) as err:
            logger.warning("LLM planning failed (%s), falling back to rules", err)

    result = _rules_plan(tasks, start_hour, max_blocks, now)
    result["provider"] = "rules"
    return result
