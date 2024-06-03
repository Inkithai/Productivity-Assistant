from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = "user"
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    context: dict = {}
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)


class ChatResponse(BaseModel):
    reply: str
    intent: str
    provider: str
