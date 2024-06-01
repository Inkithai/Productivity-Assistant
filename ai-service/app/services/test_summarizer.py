from app.services.summarizer import summarize

NOTE = (
    "Kickoff for the payments project. The deadline for the payments project is "
    "Friday and the client will not move it. Integration with the banking API is "
    "still pending because we are waiting on sandbox credentials. Testing needs "
    "to be completed before the Friday deadline. The final review is scheduled "
    "for tomorrow afternoon with the whole team. Action items: Dana chases the "
    "credentials, I finish the integration tests."
)


class _Disabled:
    enabled = False
    openai_api_key = None
    openai_base_url = "https://api.openai.com/v1"
    openai_model = "gpt-4o-mini"
    llm_timeout_seconds = 5.0


def test_extracts_key_points():
    result = summarize(NOTE, max_points=4, client=_Disabled())

    assert result["provider"] == "rules"
    assert 3 <= len(result["key_points"]) <= 4
    joined = " ".join(result["key_points"]).lower()
    assert "deadline" in joined
    assert "credentials" in joined


def test_summary_is_a_short_paragraph():
    result = summarize(NOTE, max_points=4, client=_Disabled())
    assert len(result["summary"]) < len(NOTE)
    assert result["summary"].endswith((".", "!"))


def test_short_notes_return_their_sentences():
    result = summarize("One line. Two lines.", max_points=5, client=_Disabled())
    assert result["key_points"] == ["One line.", "Two lines."]


def test_deterministic_output():
    first = summarize(NOTE, max_points=4, client=_Disabled())
    second = summarize(NOTE, max_points=4, client=_Disabled())
    assert first == second


class _JsonClient:
    enabled = True

    def chat(self, *args, **kwargs):
        return (
            '{"summary": "Payments project due Friday. API credentials pending.", '
            '"key_points": ["Deadline is Friday", "API credentials pending", "Review tomorrow"]}'
        )


def test_llm_summary_passes_through():
    result = summarize(NOTE, max_points=3, client=_JsonClient())

    assert result["provider"] == "openai"
    assert result["key_points"] == [
        "Deadline is Friday",
        "API credentials pending",
        "Review tomorrow",
    ]
