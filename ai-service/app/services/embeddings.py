"""Text embeddings with a deterministic offline fallback.

The fallback hashes tokens into a fixed-width normalised vector. It is not a
semantic model, but it keeps search working (keyword-level) when no provider
is configured and makes the whole pipeline testable in CI.
"""

import logging
import math
import re
import zlib

from app.config import get_settings

logger = logging.getLogger(__name__)

FALLBACK_DIMENSIONS = 1024
TOKEN_RE = re.compile(r"[a-z0-9']+")


class EmbeddingError(Exception):
    pass


def _fallback_embed(text):
    vector = [0.0] * FALLBACK_DIMENSIONS
    tokens = TOKEN_RE.findall(text.lower())
    for token in tokens:
        slot = zlib.crc32(token.encode("utf-8")) % FALLBACK_DIMENSIONS
        vector[slot] += 1.0
    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector
    return [value / norm for value in vector]


class EmbeddingClient:
    def __init__(self, settings=None):
        self.settings = settings or get_settings()
        self._llm_key = self.settings.openai_api_key

    @property
    def provider(self) -> str:
        return "openai" if self._llm_key else "fallback"

    def _embed_with_openai(self, texts):
        from openai import APIError, APITimeoutError, OpenAI

        client = OpenAI(
            api_key=self._llm_key,
            base_url=self.settings.openai_base_url,
            timeout=self.settings.llm_timeout_seconds,
        )
        try:
            response = client.embeddings.create(
                model=self.settings.embedding_model,
                input=texts,
            )
        except (APITimeoutError, APIError) as err:
            raise EmbeddingError(f"embedding provider failed: {err}") from err

        ordered = sorted(response.data, key=lambda item: item.index)
        return [item.embedding for item in ordered]

    def embed_batch(self, texts):
        """Embed a list of texts with the active provider, or the fallback."""
        if not self._llm_key:
            return [_fallback_embed(text) for text in texts], "fallback"
        try:
            vectors = self._embed_with_openai(texts)
            return vectors, "openai"
        except EmbeddingError as err:
            logger.warning("embedding provider failed (%s), using fallback", err)
        return [_fallback_embed(text) for text in texts], "fallback"

    def embed(self, text):
        vectors, provider = self.embed_batch([text])
        return vectors[0], provider
