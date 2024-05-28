from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas.tasks import PrioritizeRequest, PrioritizeResponse
from app.services import prioritizer

router = APIRouter(prefix="/tasks", tags=["prioritization"])


@router.post("/prioritize", response_model=PrioritizeResponse)
def prioritize_tasks(payload: PrioritizeRequest):
    now = None
    if payload.now:
        try:
            now = datetime.fromisoformat(payload.now.replace("Z", "+00:00"))
        except ValueError:
            now = None
    if now is not None and now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    suggestions = prioritizer.prioritize(
        [task.model_dump() for task in payload.tasks], now=now
    )
    return PrioritizeResponse(suggestions=suggestions)
