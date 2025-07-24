from pydantic import BaseModel, Field

from app.schemas.tasks import TaskInput


class DayPlanRequest(BaseModel):
    tasks: list[TaskInput] = Field(max_length=100)
    start_hour: int = Field(default=9, ge=0, le=23)
    max_blocks: int = Field(default=5, ge=1, le=8)


class PlanBlock(BaseModel):
    title: str
    start: str
    end: str
    reason: str = ""


class DayPlanResponse(BaseModel):
    blocks: list[PlanBlock]
    focus_minutes: int
    provider: str
    note: str | None = None
