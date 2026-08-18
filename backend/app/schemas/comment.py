import uuid
from datetime import datetime

from pydantic import BaseModel


class CommentCreate(BaseModel):
    text: str


class CommentOut(BaseModel):
    id: uuid.UUID
    author_id: uuid.UUID
    author_nickname: str
    author_avatar_url: str | None = None
    text: str
    likes_count: int
    # Oturum sahibine göre değişen alanlar — UI aksiyon durumlarını bunlardan okur.
    is_liked: bool = False
    is_mine: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class CommentLikeResponse(BaseModel):
    liked: bool
    likes_count: int
