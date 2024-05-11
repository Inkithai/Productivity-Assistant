"""Natural language date parsing for quick-add phrases like "next friday at 5pm".

Deliberately small: only the patterns that actually show up in quick input are
recognised, and anything unmatched is left in the title untouched.
"""

import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

WEEKDAYS = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}

MONTHS = {
    "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
    "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7,
    "aug": 8, "august": 8, "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10, "nov": 11, "november": 11, "dec": 12, "december": 12,
}

DEFAULT_TIME = 9
DAY_PARTS = {"morning": 9, "afternoon": 14, "evening": 19, "night": 20}
WORD_NUMBERS = {"a": 1, "an": 1, "two": 2, "three": 3, "four": 4, "five": 5}


@dataclass
class ParsedWhen:
    when: datetime | None
    span: tuple[int, int] | None

    @property
    def matched(self) -> bool:
        return self.when is not None


def _days_in_month(year, month):
    if month == 2:
        leap = year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
        return 29 if leap else 28
    return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]


def _shift_weekday(now, target, force_next_week=False):
    if force_next_week:
        start_of_next_week = now - timedelta(days=now.weekday()) + timedelta(days=7)
        return start_of_next_week + timedelta(days=target)
    days_ahead = (target - now.weekday()) % 7
    return now + timedelta(days=days_ahead)


RELATIVE_RE = re.compile(r"\bin (\d+|a|an|two|three|four|five) (minutes?|hours?|days?|weeks?)\b")
TODAY_RE = re.compile(r"\b(today|tonight|tonite)\b")
TOMORROW_RE = re.compile(r"\b(tomorrow|tmrw|tmr)\b")
WEEKDAY_RE = re.compile(
    r"\b(?:next\s+|this\s+|on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b"
)
NEXT_UNIT_RE = re.compile(r"\bnext (week|month)\b")
DAY_MONTH_NAME_RE = re.compile(
    r"\b(?:on\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?"
    r"(jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*)\b"
)
MONTH_NAME_DAY_RE = re.compile(
    r"\b(jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*)\s+(\d{1,2})(?:st|nd|rd|th)?\b"
)
NUMERIC_DATE_RE = re.compile(r"\b(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?\b")
END_OF_RE = re.compile(r"\bend of (?:the )?(day|week)\b")


def _parse_number(word):
    if word.isdigit():
        return int(word)
    return WORD_NUMBERS.get(word, 1)


def _month_from_name(name):
    return MONTHS.get(name.lower()[:3] if name.lower()[:3] in MONTHS else name.lower()[:4])


def _resolve_relative(match, now):
    amount = _parse_number(match.group(1))
    unit = match.group(2).rstrip("s")
    deltas = {"minute": timedelta(minutes=amount), "hour": timedelta(hours=amount),
              "day": timedelta(days=amount), "week": timedelta(weeks=amount)}
    return now + deltas[unit], unit not in ("minute", "hour")


def _resolve_calendar_date(day, month, year, now):
    year = year or now.year
    try:
        resolved = now.replace(year=year, month=month, day=min(day, _days_in_month(year, month)))
    except ValueError:
        return None
    if resolved < now - timedelta(days=1) and year == now.year:
        resolved = resolved.replace(year=year + 1)
    return resolved


def _resolve_date_match(pattern, match, now):
    if pattern is RELATIVE_RE:
        return _resolve_relative(match, now)[0]

    if pattern is TODAY_RE:
        return now

    if pattern is TOMORROW_RE:
        return now + timedelta(days=1)

    if pattern is WEEKDAY_RE:
        target = WEEKDAYS[match.group(1)]
        force_next = bool(re.match(r"\bnext\b", match.group(0)))
        return _shift_weekday(now, target, force_next_week=force_next)

    if pattern is NEXT_UNIT_RE:
        if match.group(1) == "week":
            return now + timedelta(days=7)
        month = now.month + 1 if now.month < 12 else 1
        year = now.year + (1 if now.month == 12 else 0)
        return now.replace(year=year, month=month, day=min(now.day, _days_in_month(year, month)))

    if pattern is DAY_MONTH_NAME_RE:
        return _resolve_calendar_date(int(match.group(1)), _month_from_name(match.group(2)), None, now)

    if pattern is MONTH_NAME_DAY_RE:
        return _resolve_calendar_date(int(match.group(2)), _month_from_name(match.group(1)), None, now)

    if pattern is NUMERIC_DATE_RE:
        # day-first, matching how the team writes dates (15/08)
        year = int(match.group(3)) if match.group(3) else None
        if year is not None and year < 100:
            year += 2000
        return _resolve_calendar_date(int(match.group(1)), int(match.group(2)), year, now)

    if pattern is END_OF_RE:
        if match.group(1) == "day":
            return now
        return _shift_weekday(now, 4, force_next_week=now.weekday() >= 4)

    return None


DATE_PATTERNS = [
    RELATIVE_RE,
    TODAY_RE,
    TOMORROW_RE,
    WEEKDAY_RE,
    NEXT_UNIT_RE,
    DAY_MONTH_NAME_RE,
    MONTH_NAME_DAY_RE,
    NUMERIC_DATE_RE,
    END_OF_RE,
]

CLOCK_RE = re.compile(r"\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b")
CLOCK_24H_RE = re.compile(r"\bat (\d{1,2}):(\d{2})\b")
DAY_PART_RE = re.compile(r"\b(morning|afternoon|evening|night)\b")
NOON_RE = re.compile(r"\bnoon\b")
MIDNIGHT_RE = re.compile(r"\bmidnight\b")


def _resolve_time_match(pattern, match):
    if pattern is NOON_RE:
        return 12, 0
    if pattern is MIDNIGHT_RE:
        return 0, 0
    if pattern is DAY_PART_RE:
        return DAY_PARTS[match.group(1)], 0

    groups = match.groups()
    hour = int(groups[0])
    minute = int(groups[1]) if len(groups) > 1 and groups[1] else 0
    meridiem = groups[2].lower() if len(groups) > 2 and groups[2] else None

    if meridiem == "pm" and hour < 12:
        hour += 12
    elif meridiem == "am" and hour == 12:
        hour = 0
    elif meridiem is None and hour < 8:
        # a bare "at 5" reads as late afternoon in quick-add input
        hour += 12
    return hour, minute


TIME_PATTERNS = [CLOCK_RE, CLOCK_24H_RE, DAY_PART_RE, NOON_RE, MIDNIGHT_RE]


def parse_when(text, now=None):
    """Find a date/time phrase in `text`.

    Returns a ParsedWhen with the resolved datetime (naive local) and the span
    of the matched phrase, or when=None when nothing was recognised.
    """
    now = now or datetime.now()
    lowered = text.lower()

    date_result = None
    for pattern in DATE_PATTERNS:
        match = pattern.search(lowered)
        if not match:
            continue
        resolved = _resolve_date_match(pattern, match, now)
        if resolved is not None:
            keeps_time = pattern is RELATIVE_RE and match.group(2).rstrip("s") in ("minute", "hour")
            date_result = (match, resolved, keeps_time)
            break

    time_result = None
    for pattern in TIME_PATTERNS:
        match = pattern.search(lowered)
        if match:
            hour, minute = _resolve_time_match(pattern, match)
            time_result = (match, hour, minute)
            break

    if date_result is None and time_result is None:
        return ParsedWhen(when=None, span=None)

    if date_result is None:
        # time only: today, or tomorrow when the slot has already passed
        hour, minute = time_result[1], time_result[2]
        candidate = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if candidate <= now:
            candidate += timedelta(days=1)
        return ParsedWhen(when=candidate, span=(time_result[0].start(), time_result[0].end()))

    match, resolved, keeps_time = date_result
    if keeps_time:
        when = resolved.replace(second=0, microsecond=0)
    else:
        if time_result is None:
            if match.group(0) in ("tonight", "tonite"):
                hour, minute = 20, 0
            else:
                hour, minute = DEFAULT_TIME, 0
        else:
            hour, minute = time_result[1], time_result[2]
        when = resolved.replace(hour=hour, minute=minute, second=0, microsecond=0)
    start = match.start()
    end = match.end()
    if time_result and time_result[0].start() > match.end():
        end = time_result[0].end()
    return ParsedWhen(when=when, span=(start, end))


def strip_phrase(text, span):
    """Remove a matched phrase and tidy the leftover title."""
    if not span:
        return text
    stripped = text[: span[0]] + " " + text[span[1]:]
    stripped = re.sub(r"\s{2,}", " ", stripped)
    return stripped.strip(" ,-:;")


def to_utc_iso(naive_local, tz_name):
    """Interpret a naive datetime in `tz_name` and return a UTC ISO string."""
    localized = naive_local.replace(tzinfo=ZoneInfo(tz_name))
    return localized.astimezone(ZoneInfo("UTC")).isoformat()
