from pydantic import BaseModel, Field


class TaskInput(BaseModel):
    id: str
    title: str = ""
    priority: str = "medium"
    status: str = "todo"
    due_date: str | None = None
    created_at: str | None = None


class PrioritizeRequest(BaseModel):
    tasks: list[TaskInput] = Field(max_length=100)
    now: str | None = None


class ScoredTask(BaseModel):
    id: str
    title: str = ""
    score: int
    bucket: str
    reason: str


class PrioritizeResponse(BaseModel):
    suggestions: list[ScoredTask]
