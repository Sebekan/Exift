import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    nickname: str
    email: EmailStr
    password: str
    phone: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    nickname: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    phone: str | None = None


class UserOut(BaseModel):
    id: uuid.UUID
    nickname: str
    email: str
    bio: str
    avatar_url: str | None
    phone: str | None = None
    is_verified: bool = False
    joined_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class EmailVerifyRequest(BaseModel):
    token: str
