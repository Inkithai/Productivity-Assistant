from pydantic import BaseModel, Field, field_validator

from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def _check_timezone(value):
    try:
        ZoneInfo(value)
    except (ZoneInfoNotFoundError, ValueError) as err:
        raise ValueError(f"unknown timezone: {value}") from err
    return value


class ExtractTaskRequest(BaseModel):
    text: str = Field(min_length=3, max_length=500)
    timezone: str = "UTC"

    _validate_tz = field_validator("timezone")(_check_timezone)


class ExtractedTask(BaseModel):
    title: str
    due_date: str | None = None
    priority: str
    tags: list[str] = []
    confidence: float
    provider: str


class ExtractTaskResponse(BaseModel):
    task: ExtractedTask
