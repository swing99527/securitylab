"""
Pydantic schemas for authentication
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid


# Request Schemas
class LoginRequest(BaseModel):
    """Login request"""
    email: EmailStr
    password: str = Field(..., min_length=6)


class TokenRefreshRequest(BaseModel):
    """Token refresh request"""
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    """Change password request"""
    old_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)


# Response Schemas
class Token(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User response"""
    id: uuid.UUID
    email: str
    name: str
    role: str
    department: Optional[str] = None
    avatar: Optional[str] = None
    status: str
    
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Login response with token and user info"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class CurrentUserResponse(UserResponse):
    """Current user detailed response"""
    last_login_at: Optional[datetime] = None
    created_at: datetime
