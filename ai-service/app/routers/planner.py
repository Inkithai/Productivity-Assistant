from fastapi import APIRouter

from app.schemas.planner import DayPlanRequest, DayPlanResponse
from app.services import planner

router = APIRouter(prefix="/planner", tags=["planner"])


@router.post("/day", response_model=DayPlanResponse)
def plan_day(payload: DayPlanRequest):
    result = planner.plan_day(
        [task.model_dump() for task in payload.tasks],
        start_hour=payload.start_hour,
        max_blocks=payload.max_blocks,
    )
    return DayPlanResponse(**result)
