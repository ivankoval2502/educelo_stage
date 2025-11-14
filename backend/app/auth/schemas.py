from pydantic import BaseModel, EmailStr, Field, validator
import uuid
from datetime import datetime

class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: uuid.UUID
    username: str
    email: str
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: str | None = None

class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None

    @validator('username')
    def username_min_length(cls, v):
        if v and len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        return v

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @validator('new_password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class GoalUpdate(BaseModel):
    weekly_goal_hours: int

    @validator('weekly_goal_hours')
    def goal_range(cls, v):
        if v < 1 or v > 16:
            raise ValueError('Goal must be between 1 and 16 hours')
        return v