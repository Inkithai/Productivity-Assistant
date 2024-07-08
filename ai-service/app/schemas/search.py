from pydantic import BaseModel, Field


class SearchItem(BaseModel):
    id: str
    type: str
    title: str = ""
    content: str | None = None
    embedding: list[float] | None = None
    embedding_provider: str | None = None


class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=200)
    items: list[SearchItem] = Field(max_length=200)
    limit: int = Field(default=10, ge=1, le=25)


class SearchResult(BaseModel):
    id: str
    type: str
    title: str
    score: float


class EmbeddingRefresh(BaseModel):
    id: str
    type: str
    vector: list[float]
    provider: str


class SearchResponse(BaseModel):
    results: list[SearchResult]
    embeddings: list[EmbeddingRefresh]
    provider: str
