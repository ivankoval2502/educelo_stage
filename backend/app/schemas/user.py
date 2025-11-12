from pydantic import BaseModel, EmailStr, Field
import uuid
from datetime import datetime

class User (BaseModel):
    user_id: uuid
    username: str
    email: EmailStr
    password: str
    is_active: bool
    created_at: datetime

class CreateUser(BaseModel):
    user_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    username: str
    email: str
    password: str
    is_active: True
    created_at: datetime = Field(default_factory=datetime.now)

class LoginUser(BaseModel):
    email:str
    password:str