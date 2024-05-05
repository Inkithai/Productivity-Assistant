from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "productivity-assistant-ai"
    ai_service_token: str = "dev-service-token"

    server_url: str = "http://localhost:4000"

    openai_api_key: str | None = None
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"
    embedding_model: str = "text-embedding-3-small"

    llm_timeout_seconds: float = 20.0
    max_summary_input_chars: int = 12000
    max_context_items: int = 40

    @property
    def llm_enabled(self) -> bool:
        return bool(self.openai_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
