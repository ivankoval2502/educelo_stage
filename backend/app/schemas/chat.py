from pydantic import BaseModel
from typing import List

class ChatRequest(BaseModel):
    message: str
    context: List[str] | None = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: int