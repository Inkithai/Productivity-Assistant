from datetime import datetime

from app.services.nl_dates import parse_when, strip_phrase, to_utc_iso

NOW = datetime(2024, 5, 9, 11, 30)  # Thursday


def check(text, expected):
    result = parse_when(text, now=NOW)
    assert result.when is not None, f"no match for: {text}"
    assert result.when == expected, f"{text}: {result.when} != {expected}"
    return result


def test_today_and_tomorrow():
    check("submit the report today", datetime(2024, 5, 9, 9))
    check("call the bank tomorrow", datetime(2024, 5, 10, 9))
    check("buy milk tmrw at 6pm", datetime(2024, 5, 10, 18))
    check("deploy tonight", datetime(2024, 5, 9, 20))


def test_weekdays():
    # Thursday -> next friday is tomorrow
    check("standup on friday", datetime(2024, 5, 10, 9))
    # "next monday" from a Thursday is the Monday of next week
    check("dentist next monday", datetime(2024, 5, 13, 9))
    # same weekday this week counts as today
    check("review PRs this thursday", datetime(2024, 5, 9, 9))


def test_relative_offsets():
    check("water plants in 2 hours", datetime(2024, 5, 9, 13, 30))
    check("check oven in 30 minutes", datetime(2024, 5, 9, 12, 0))
    check("follow up in 3 days", datetime(2024, 5, 12, 9))
    check("renew licence in 2 weeks", datetime(2024, 5, 23, 9))


def test_times():
    check("meeting at 3pm", datetime(2024, 5, 9, 15, 0))
    # 10:30 already passed at 11:30, so it rolls to tomorrow
    check("meeting at 10:30am", datetime(2024, 5, 10, 10, 30))
    check("meeting at 17:45", datetime(2024, 5, 9, 17, 45))
    check("lunch at noon", datetime(2024, 5, 9, 12, 0))
    check("call mom in the evening", datetime(2024, 5, 9, 19, 0))


def test_time_only_rolls_to_next_day_when_passed():
    # 8am has already passed at 11:30
    result = check("standup at 8am", datetime(2024, 5, 10, 8))
    assert result is not None


def test_named_dates():
    check("budget review on 21 june", datetime(2024, 6, 21, 9))
    check("budget review on june 21st", datetime(2024, 6, 21, 9))
    check("visa appointment 15/08", datetime(2024, 8, 15, 9))
    check("flight on 03/01/2025", datetime(2025, 1, 3, 9))


def test_dates_in_the_past_roll_to_next_year():
    check("anniversary on 2 january", datetime(2025, 1, 2, 9))


def test_next_week_and_month():
    check("retro next week", datetime(2024, 5, 16, 9))
    check("subscription next month", datetime(2024, 6, 9, 9))


def test_combined_date_and_time():
    check("interview next friday at 2:30pm", datetime(2024, 5, 17, 14, 30))
    check("release tomorrow morning", datetime(2024, 5, 10, 9))


def test_no_match_leaves_text_alone():
    result = parse_when("think about the architecture some more", now=NOW)
    assert result.matched is False
    assert result.span is None


def test_strip_removes_phrase():
    text = "prepare slides for next friday please"
    result = parse_when(text, now=NOW)
    stripped = strip_phrase(text, result.span)
    assert "next friday" not in stripped
    assert "prepare slides" in stripped


def test_utc_conversion():
    naive = datetime(2024, 5, 10, 9, 0)
    iso = to_utc_iso(naive, "Asia/Colombo")
    assert iso.startswith("2024-05-10T03:30:00")
