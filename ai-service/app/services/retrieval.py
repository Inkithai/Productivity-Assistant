"""Cosine similarity ranking for semantic search."""

import math

from app.services.embeddings import EmbeddingClient


def cosine_similarity(vec_a, vec_b):
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _embeddable_text(item):
    parts = [item.get("title") or ""]
    content = item.get("content") or ""
    if content:
        parts.append(content[:2000])
    return "\n".join(parts)


def search_items(query, items, client=None, limit=10):
    """Rank `items` (dicts with id/type/title/content/embedding) against `query`.

    Items whose stored embedding was produced by a different provider are
    re-embedded with the active one. Returns (results, refreshes) where
    refreshes carries vectors the caller should persist.
    """
    client = client or EmbeddingClient()

    reusable = []
    stale = []
    for item in items:
        embedding = item.get("embedding")
        if embedding and item.get("embedding_provider") == client.provider:
            reusable.append(item)
        else:
            stale.append(item)

    refreshed = []
    if stale:
        vectors, provider = client.embed_batch([_embeddable_text(item) for item in stale])
        for item, vector in zip(stale, vectors):
            updated = {**item, "embedding": vector, "embedding_provider": provider}
            reusable.append(updated)
            refreshed.append(updated)

    query_vector, provider = client.embed(query)

    scored = []
    for item in reusable:
        score = cosine_similarity(query_vector, item.get("embedding"))
        if score > 0.05:
            scored.append(
                {
                    "id": item.get("id"),
                    "type": item.get("type"),
                    "title": item.get("title") or "",
                    "score": round(score, 4),
                }
            )

    scored.sort(key=lambda entry: entry["score"], reverse=True)

    refreshes = [
        {
            "id": item["id"],
            "type": item["type"],
            "vector": item["embedding"],
            "provider": item["embedding_provider"],
        }
        for item in refreshed
    ]
    return scored[:limit], refreshes, provider
