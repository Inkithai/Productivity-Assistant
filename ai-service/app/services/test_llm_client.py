from app.services.llm_client import LLMClient, LLMError


class FakeSettings:
    llm_enabled = False
    openai_api_key = None
    openai_base_url = "https://api.openai.com/v1"
    openai_model = "gpt-4o-mini"
    llm_timeout_seconds = 5.0


def test_reports_fallback_provider_without_key():
    client = LLMClient(FakeSettings())
    assert client.provider == "fallback"
    assert client.enabled is False


def test_chat_raises_when_disabled():
    client = LLMClient(FakeSettings())
    try:
        client.chat([{"role": "user", "content": "hi"}])
    except LLMError as err:
        assert "not configured" in str(err)
    else:
        raise AssertionError("expected LLMError")
