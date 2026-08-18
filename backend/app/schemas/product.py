import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.user import UserOut


class ProductCreate(BaseModel):
    title: str
    story: str = ""
    price: float
    category: str
    district: str
    image_url: str = ""
    images: list[str] = []


class ProductUpdate(BaseModel):
    title: str | None = None
    story: str | None = None
    price: float | None = None
    category: str | None = None
    district: str | None = None
    image_url: str | None = None
    images: list[str] | None = None


class SellerInfo(BaseModel):
    id: uuid.UUID
    nickname: str
    bio: str
    avatar_url: str | None

    model_config = {"from_attributes": True}


class ProductOut(BaseModel):
    id: uuid.UUID
    title: str
    story: str
    price: float
    category: str
    district: str
    image_url: str
    images: list[str]
    has_story: bool
    sold: bool
    sold_date: datetime | None
    is_published: bool
    museum_status: str
    seller: SellerInfo
    comments_count: int = 0
    likes_count: int = 0
    is_liked: bool = False
    is_favorited: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    pages: int


class LikeResponse(BaseModel):
    liked: bool
    likes_count: int


class FavoriteResponse(BaseModel):
    favorited: bool
