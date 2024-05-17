from datetime import datetime

from app.services.extractor import extract_task
from app.services.llm_client import LLMClient, LLMError

NOW = datetime(2024, 5, 15, 10, 0)  # Wednesday


def extract(text, tz="Asia/Colombo"):
    return extract_task(text, tz=tz, now=NOW, client=LLMClient(_DisabledSettings()))


class _DisabledSettings:
    llm_enabled = False
    openai_api_key = None
    openai_base_url = "https://api.openai.com/v1"
    openai_model = "gpt-4o-mini"
    llm_timeout_seconds = 5.0


def test_strips_lead_ins():
    result = extract("remind me to prepare for the interview")
    assert result["title"] == "Prepare for the interview"
    assert result["priority"] == "medium"


def test_extracts_date_and_title():
    result = extract("remind me to prepare for my interview next friday")
    assert result["title"] == "Prepare for my interview"
    assert result["due_date"] == "2024-05-24T03:30:00+00:00"
    assert result["priority"] == "medium"


def test_detects_high_priority():
    result = extract("fix the production bug urgently")
    assert result["priority"] == "high"
    assert "urgent" not in result["title"].lower()


def test_detects_low_priority():
    result = extract("reorganise the bookshelf eventually")
    assert result["priority"] == "low"


def test_reminder_phrases_become_reminders_via_due_date():
    result = extract("remind me about the project review tomorrow at 10 am")
    assert result["title"] == "Project review"
    assert result["due_date"].startswith("2024-05-16")


def test_no_date_leaves_due_date_empty():
    result = extract("think about the onboarding flow")
    assert result["due_date"] is None
    assert result["confidence"] < 0.7


def test_degenerate_input_keeps_raw_text():
    result = extract("tomorrow at 5pm")
    assert result["title"]
    assert result["due_date"] is not None


class _FailingClient:
    enabled = True

    def chat(self, *args, **kwargs):
        raise LLMError("provider down")


def test_falls_back_to_rules_when_llm_fails():
    result = extract_task(
        "remind me to email Dana next monday",
        tz="UTC",
        now=NOW,
        client=_FailingClient(),
    )
    assert result["provider"] == "rules"
    assert result["title"] == "Email Dana"
    assert result["due_date"].startswith("2024-05-20")


class _JsonClient:
    enabled = True

    def chat(self, *args, **kwargs):
        return '{"title": "Review the contract", "due_date": "2024-05-20T00:00:00Z", "priority": "high", "tags": ["legal"], "confidence": 0.9}'


def test_llm_response_is_normalised():
    result = extract_task(
        "look at the contract thing",
        tz="UTC",
        now=NOW,
        client=_JsonClient(),
    )
    assert result["provider"] == "openai"
    assert result["title"] == "Review the contract"
    assert result["priority"] == "high"
    assert result["tags"] == ["legal"]
