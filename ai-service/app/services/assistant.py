"""Chat assistant that answers from the user's own data.

Frequent questions (what's due today, what to prioritize, what's coming up)
are answered by a small intent router so they work without an LLM key.
Everything else is forwarded to the provider with the user's context in the
prompt, with a helpful offline fallback.
"""

import json
import logging
import re

from app.services.llm_client import LLMClient, LLMError
from app.services.prioritizer import prioritize

logger = logging.getLogger(__name__)

PRIORITY_ICONS = {"high": "🔴", "medium": "🟡", "low": "🟢"}

INTENT_PATTERNS = [
    ("today", re.compile(r"(what|which|anything|things?).*(today|due today)|today'?s tasks|finish today|due today", re.I)),
    ("prioritize", re.compile(r"prioriti|what should i (do|start|work on)|where.*start|focus on|most important", re.I)),
    ("deadlines", re.compile(r"deadline|due (this|next) week|coming up|upcoming|due soon", re.I)),
    ("notes", re.compile(r"summar(y|ise|ize).*notes?|my notes|recent notes|notes? (about|on)", re.I)),
    ("plan", re.compile(r"plan (my|the) (day|week)|schedule (my|the) (day|week)|how.*plan", re.I)),
    ("help", re.compile(r"^help$|what can you do|who are you", re.I)),
]

HELP_TEXT = (
    "I can help you work with your own stuff. Try asking:\n"
    "• What do I need to finish today?\n"
    "• Which tasks should I prioritize?\n"
    "• What deadlines are coming this week?\n"
    "• Summarize my notes\n"
    "You can also add tasks by typing them as sentences on the Tasks page."
)


def detect_intent(message):
    for intent, pattern in INTENT_PATTERNS:
        if pattern.search(message):
            return intent
    return "general"


def _format_task(task):
    icon = PRIORITY_ICONS.get(task.get("priority"), "•")
    label = task.get("title") or "Untitled"
    if task.get("due_date"):
        return f"{icon} {label} (due {task['due_date'][:10]})"
    return f"{icon} {label}"


def _answer_today(context):
    tasks = context.get("today_tasks") or []
    overdue = context.get("overdue") or []
    lines = []
    if overdue:
        lines.append(f"⚠️ {len(overdue)} task(s) are overdue:")
        lines.extend(f"  {_format_task(task)}" for task in overdue[:5])
    if tasks:
        lines.append(f"You have {len(tasks)} task(s) due today:")
        lines.extend(f"  {_format_task(task)}" for task in tasks[:8])
    if not lines:
        return "Nothing is due today. A good day to get ahead on upcoming work."
    return "\n".join(lines)


def _answer_prioritize(context):
    open_tasks = (context.get("today_tasks") or []) + (context.get("overdue") or [])
    open_tasks += (context.get("upcoming") or [])[:10]
    if not open_tasks:
        return "You have no open tasks right now — enjoy the breather."

    ranked = prioritize(open_tasks)[:3]
    lines = ["I'd start with these:"]
    for index, item in enumerate(ranked, start=1):
        lines.append(f"{index}. {item['title']} — {item['reason']}")
    return "\n".join(lines)


def _answer_deadlines(context):
    upcoming = context.get("upcoming") or []
    if not upcoming:
        return "No deadlines in the next two weeks."
    lines = ["Coming up:"]
    for task in upcoming[:8]:
        due = (task.get("due_date") or "")[:10]
        lines.append(f"• {task.get('title')} — {due}")
    return "\n".join(lines)


def _answer_notes(context):
    notes = context.get("recent_notes") or []
    if not notes:
        return "You haven't written any notes yet."
    lines = ["Your recent notes:"]
    lines.extend(f"• {note.get('title')}" for note in notes[:6])
    lines.append("\nOpen a note and hit Summarize if you want the key points.")
    return "\n".join(lines)


def _answer_plan(context):
    tasks = (context.get("overdue") or []) + (context.get("today_tasks") or [])
    if not tasks:
        return "Nothing on your plate today. Maybe plan tomorrow or take a walk?"

    ranked = prioritize(tasks)
    lines = ["Here's a plan for today:"]
    for slot, item in enumerate(ranked[:4], start=1):
        lines.append(f"{slot}. {item['title']} — {item['reason']}")
    lines.append("\nTake a 10 minute break between blocks, and leave the last hour free.")
    return "\n".join(lines)


FALLBACK_ANSWERS = {
    "today": _answer_today,
    "prioritize": _answer_prioritize,
    "deadlines": _answer_deadlines,
    "notes": _answer_notes,
    "plan": _answer_plan,
}


def _llm_answer(message, context, client, history):
    context_lines = []
    for key in ("today_tasks", "overdue", "upcoming"):
        context_lines.append(
            json.dumps(
                [{k: t.get(k) for k in ("title", "priority", "due_date", "status")}
                 for t in context.get(key) or []][:15],
            )
        )
    context_lines.append(
        json.dumps([note.get("title") for note in (context.get("recent_notes") or [])][:10])
    )

    messages = [
        {
            "role": "system",
            "content": (
                "You are a concise personal productivity assistant. Answer using "
                "the user's context below; if it is not enough, say so briefly "
                "and suggest what they could ask instead.\n"
                f"today_tasks: {context_lines[0]}\n"
                f"overdue: {context_lines[1]}\n"
                f"upcoming: {context_lines[2]}\n"
                f"recent_notes: {context_lines[3]}"
            ),
        },
        *[
            {"role": entry.get("role", "user"), "content": str(entry.get("content", ""))}
            for entry in (history or [])[-6:]
        ],
        {"role": "user", "content": message},
    ]
    return client.chat(messages, temperature=0.4)


def answer(message, context=None, history=None, client=None):
    context = context or {}
    client = client or LLMClient()
    intent = detect_intent(message)

    if intent == "help":
        return {"reply": HELP_TEXT, "intent": intent, "provider": "rules"}

    if client.enabled:
        try:
            reply = _llm_answer(message, context, client, history)
            return {"reply": reply, "intent": intent, "provider": "openai"}
        except LLMError as err:
            logger.warning("LLM chat failed (%s), using rules", err)

    fallback = FALLBACK_ANSWERS.get(intent)
    if fallback is None:
        return {
            "reply": (
                "I can't answer that without the AI provider being configured, "
                "but I can tell you about today's tasks, priorities, deadlines "
                "or your notes."
            ),
            "intent": intent,
            "provider": "fallback",
        }
    return {"reply": fallback(context), "intent": intent, "provider": "rules"}
