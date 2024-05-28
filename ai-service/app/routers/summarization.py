from fastapi import APIRouter

from app.config import get_settings
from app.schemas.notes import SummarizeRequest, SummarizeResponse
from app.services import summarizer

router = APIRouter(prefix="/notes", tags=["summarization"])


@router.post("/summarize", response_model=SummarizeResponse)
def summarize_note(payload: SummarizeRequest):
    settings = get_settings()
    text = payload.text[: settings.max_summary_input_chars]
    result = summarizer.summarize(text, max_points=payload.max_points)
    return SummarizeResponse(**result)
