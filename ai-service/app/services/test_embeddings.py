from app.services.embeddings import EmbeddingClient, _fallback_embed
from app.services.retrieval import cosine_similarity, search_items


class _FallbackSettings:
    openai_api_key = None
    openai_base_url = "https://api.openai.com/v1"
    embedding_model = "text-embedding-3-small"
    llm_timeout_seconds = 5.0


def test_fallback_embedding_is_normalised():
    vector = _fallback_embed("prepare for the interview")
    assert len(vector) == 256
    norm = sum(value * value for value in vector) ** 0.5
    assert abs(norm - 1.0) < 1e-9


def test_fallback_embedding_is_deterministic():
    assert _fallback_embed("hello world") == _fallback_embed("hello world")


def test_related_text_scores_higher_than_unrelated():
    query = _fallback_embed("interview preparation")
    related = _fallback_embed("prepare for the job interview")
    unrelated = _fallback_embed("grocery shopping list")

    assert cosine_similarity(query, related) > cosine_similarity(query, unrelated)


def test_zero_vectors_score_zero():
    assert cosine_similarity([], [1.0]) == 0.0
    assert cosine_similarity([0.0, 0.0], [0.0, 0.0]) == 0.0


def test_client_reports_fallback_provider():
    client = EmbeddingClient(_FallbackSettings())
    assert client.provider == "fallback"


def test_search_items_ranks_relevant_first():
    items = [
        {"id": "n1", "type": "note", "title": "Interview questions to review", "content": "Prepare answers for the interview"},
        {"id": "n2", "type": "note", "title": "Grocery list", "content": "milk eggs bread"},
        {"id": "t1", "type": "task", "title": "Prepare for interview", "content": None},
    ]

    results, refreshes, provider = search_items("interview preparation", items, client=EmbeddingClient(_FallbackSettings()))

    assert provider == "fallback"
    assert results[0]["id"] in ("n1", "t1")
    assert results[-1]["id"] == "n2"
    # everything was embedded fresh, so all vectors come back for storage
    assert {item["id"] for item in refreshes} == {"n1", "n2", "t1"}


def test_search_reuses_matching_provider_embeddings():
    client = EmbeddingClient(_FallbackSettings())
    embedding, provider = client.embed("prepare answers for the interview")
    items = [
        {
            "id": "n1",
            "type": "note",
            "title": "Interview prep",
            "content": "questions to review",
            "embedding": embedding,
            "embedding_provider": provider,
        },
        {"id": "n2", "type": "note", "title": "Grocery list", "content": "milk eggs"},
    ]

    results, refreshes, _ = search_items("interview preparation", items, client=client)

    assert refreshes == [{"id": "n2", "type": "note", "vector": refreshes[0]["vector"], "provider": "fallback"}] or (
        len(refreshes) == 1 and refreshes[0]["id"] == "n2"
    )
    top = next(item for item in results if item["id"] == "n1")
    assert top["score"] > 0.05


def test_search_limits_results():
    items = [
        {"id": f"n{i}", "type": "note", "title": f"note number {i}", "content": "shared filler text"} for i in range(20)
    ]
    results, _, _ = search_items("shared filler", items, client=EmbeddingClient(_FallbackSettings()), limit=5)
    assert len(results) <= 5
