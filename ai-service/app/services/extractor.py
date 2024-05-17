"""Turn a quick-add sentence into structured task data.

The rules engine handles the common cases offline; when an LLM key is
configured the provider gets the first shot and the rules fill in anything
the model leaves out.
"""

import json
import logging
import re

from app.services.llm_client import LLMClient, LLMError
from app.services.nl_dates import parse_when, strip_phrase, to_utc_iso

logger = logging.getLogger(__name__)

LEAD_IN_RE = re.compile(
    r"^(?:remind me (?:to|about)|reminder (?:to|about)|remember to|"
    r"don'?t forget to|i need to|i have to|i should|please|task:)\s*",
    re.IGNORECASE,
)

PRIORITY_HINTS = {
    "high": [
        "urgent", "asap", "important", "critical", "immediately",
        "as soon as possible", "top priority",
    ],
    "low": [
        "eventually", "someday", "when i get time", "when i have time",
        "low priority", "no rush", "if possible",
    ],
}

TRAILING_PREPOSITION_RE = re.compile(r"\s+\b(?:for|on|at|by|to|in)\b\s*$", re.IGNORECASE)
LEADING_PREPOSITION_RE = re.compile(r"^\b(?:for|on|at|by|to|in)\b\s+", re.IGNORECASE)
LEADING_ARTICLE_RE = re.compile(r"^\b(?:the|a|an)\b\s+", re.IGNORECASE)

SYSTEM_PROMPT = (
    "You convert quick notes into tasks. Reply with a single JSON object with "
    'keys: title (short imperative title), due_date (ISO 8601 or null), '
    'priority ("low", "medium" or "high"), tags (list of short strings), '
    "confidence (0 to 1). Resolve relative dates against the provided "
    "reference time and timezone."
)


def _detect_priority(text):
    lowered = text.lower()
    for priority, hints in PRIORITY_HINTS.items():
        for hint in hints:
            if hint in lowered:
                cleaned = re.sub(re.escape(hint), "", text, flags=re.IGNORECASE)
                return priority, cleaned
    return None, text


def _tidy_title(text):
    cleaned = TRAILING_PREPOSITION_RE.sub("", text)
    cleaned = LEADING_PREPOSITION_RE.sub("", cleaned)
    cleaned = LEADING_ARTICLE_RE.sub("", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip(" ,-:;!")
    if not cleaned:
        return cleaned
    return cleaned[0].upper() + cleaned[1:]


def _extract_with_rules(text, tz, now):
    cleaned = LEAD_IN_RE.sub("", text.strip(), count=1)
    parsed = parse_when(cleaned, now=now)

    if parsed.matched:
        cleaned = strip_phrase(cleaned, parsed.span)

    priority, cleaned = _detect_priority(cleaned)
    title = _tidy_title(cleaned)
    if not title:
        # nothing survived the cleanup (e.g. "tomorrow at 5pm") — keep the raw text
        title = text.strip().rstrip(".!?")

    due_date = None
    if parsed.matched:
        try:
            due_date = to_utc_iso(parsed.when, tz)
        except Exception:
            due_date = parsed.when.isoformat()

    confidence = 0.55
    if parsed.matched:
        confidence += 0.2
    if priority:
        confidence += 0.15

    return {
        "title": title,
        "due_date": due_date,
        "priority": priority or "medium",
        "tags": [],
        "confidence": round(min(confidence, 0.95), 2),
        "provider": "rules",
    }


def _extract_with_llm(text, tz, client, now):
    prompt = (
        f'Note: "{text}"\n'
        f"Reference time: {now.isoformat()} (timezone {tz})"
    )
    raw = client.chat(
        [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        json_mode=True,
        temperature=0.1,
    )
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as err:
        raise LLMError(f"model returned invalid JSON: {err}") from err

    result = _extract_with_rules(text, tz, now)
    result.update(
        {
            "title": str(data.get("title") or result["title"])[:200],
            "due_date": data.get("due_date") or result["due_date"],
            "priority": data.get("priority") if data.get("priority") in ("low", "medium", "high") else result["priority"],
            "tags": [str(tag)[:30] for tag in (data.get("tags") or [])][:10],
            "confidence": min(float(data.get("confidence", 0.8)), 1.0),
            "provider": "openai",
        }
    )
    return result


def extract_task(text, tz="UTC", now=None, client=None):
    from datetime import datetime

    now = now or datetime.now()
    client = client or LLMClient()

    if client.enabled:
        try:
            return _extract_with_llm(text, tz, client, now)
        except (LLMError, ValueError) as err:
            logger.warning("LLM extraction failed (%s), falling back to rules", err)

    return _extract_with_rules(text, tz, now)
