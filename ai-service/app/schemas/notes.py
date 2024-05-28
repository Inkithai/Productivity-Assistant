from pydantic import BaseModel, Field


class SummarizeRequest(BaseModel):
    text: str = Field(min_length=10, max_length=20000)
    max_points: int = Field(default=5, ge=3, le=10)


class SummarizeResponse(BaseModel):
    summary: str
    key_points: list[str]
    provider: str
