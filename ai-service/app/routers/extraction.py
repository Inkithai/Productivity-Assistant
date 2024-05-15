from fastapi import APIRouter

from app.schemas.extraction import ExtractTaskRequest, ExtractTaskResponse
from app.services import extractor

router = APIRouter(prefix="/tasks", tags=["extraction"])


@router.post("/extract", response_model=ExtractTaskResponse)
def extract_task(payload: ExtractTaskRequest):
    task = extractor.extract_task(payload.text, tz=payload.timezone)
    return ExtractTaskResponse(task=task)
