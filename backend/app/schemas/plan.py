from pydantic import BaseModel
from datetime import datetime

class PlanCreate(BaseModel):
    title: str
    description: str
    base_prompt: str

class PlanResponse(BaseModel):
    title: str
    description: str
    base_prompt: str
    id: int
    created_at: datetime

class PlanUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    base_prompt: str | None = None
    id: int | None = None
    created_at: datetime | None = None