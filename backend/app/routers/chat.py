from fastapi import APIRouter

from app.schemas.chat import ChatResponse, ChatRequest

router = APIRouter()

@router.post('/chat', response_model=ChatResponse)
async def send_chat_message(request: ChatRequest):
    mock_response = f"It's a mock answer: {request.message}"
    return ChatResponse(response=mock_response, conversation_id=123456)
