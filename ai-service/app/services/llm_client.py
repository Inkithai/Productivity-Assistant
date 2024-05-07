"""Thin client for an OpenAI-compatible chat API.

Everything in this service is built to work without an API key: the rule-based
fallbacks in each feature module keep the product usable offline and in tests.
When a key is configured, `chat()` is the only path that talks to the provider.
"""

import logging

from openai import APIError, APITimeoutError, OpenAI

from app.config import get_settings

logger = logging.getLogger(__name__)


class LLMError(Exception):
    """Raised when the provider call fails or times out."""


class LLMClient:
    def __init__(self, settings=None):
        self.settings = settings or get_settings()
        self._client = None

    @property
    def enabled(self) -> bool:
        return self.settings.llm_enabled

    @property
    def provider(self) -> str:
        return "openai" if self.enabled else "fallback"

    def chat(self, messages, *, json_mode=False, temperature=0.3):
        """Return the assistant message text, or raise LLMError."""
        if not self.enabled:
            raise LLMError("LLM is not configured")

        if self._client is None:
            self._client = OpenAI(
                api_key=self.settings.openai_api_key,
                base_url=self.settings.openai_base_url,
                timeout=self.settings.llm_timeout_seconds,
            )

        kwargs = {
            "model": self.settings.openai_model,
            "messages": messages,
            "temperature": temperature,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        try:
            response = self._client.chat.completions.create(**kwargs)
        except (APITimeoutError, APIError) as err:
            raise LLMError(f"provider call failed: {err}") from err

        content = response.choices[0].message.content
        if not content:
            raise LLMError("provider returned an empty message")
        return content
