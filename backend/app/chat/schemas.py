from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from uuid import UUID

class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    message_id: UUID
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    title: str

class ConversationResponse(BaseModel):
    conversation_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ConversationWithMessages(ConversationResponse):
    messages: List[MessageResponse]

class ConversationUpdate(BaseModel):
    title: str