from fastapi import APIRouter

from app.schemas.search import SearchRequest, SearchResponse
from app.services.retrieval import search_items

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=SearchResponse)
def semantic_search(payload: SearchRequest):
    results, refreshes, provider = search_items(
        payload.query,
        [item.model_dump() for item in payload.items],
        limit=payload.limit,
    )
    return SearchResponse(results=results, embeddings=refreshes, provider=provider)
