from fastapi import APIRouter

from app.schemas.chat import ChatRequest, ChatResponse
from app.services import assistant

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    result = assistant.answer(
        payload.message,
        context=payload.context,
        history=[message.model_dump() for message in payload.history],
    )
    return ChatResponse(**result)
