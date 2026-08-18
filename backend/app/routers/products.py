import math
import uuid
from datetime import datetime, timezone
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_current_user_optional
from app.models.chat import Chat
from app.models.chat_message import ChatMessage
from app.models.comment import Comment
from app.models.favorite import Favorite
from app.models.like import Like
from app.models.product import Product
from app.models.user import User
from app.schemas.product import (
    FavoriteResponse,
    LikeResponse,
    ProductCreate,
    ProductListResponse,
    ProductOut,
    ProductUpdate,
    SellerInfo,
)

router = APIRouter(prefix="/api/products", tags=["products"])

MAX_TITLE_LENGTH = 200
MAX_IMAGES = 8
# image_url sütunu String(500); data: URI gibi devasa değerler DB hatası yerine
# anlaşılır bir 400 dönmeli.
MAX_IMAGE_URL_LENGTH = 500
# Aşırı uzun arama metni pahalı ILIKE taraması üretir.
MAX_SEARCH_LENGTH = 100


class SortOption(str, Enum):
    """İlan listeleme sıralaması. Frontend `sort` parametresiyle gönderir."""

    newest = "newest"
    oldest = "oldest"
    price_asc = "price_asc"
    price_desc = "price_desc"


# created_at ikincil anahtar olarak eklendi: eşit fiyatlarda sayfalama arasında
# sıra kayması (aynı ilanın iki sayfada görünmesi) olmasın.
SORT_CLAUSES: dict[SortOption, tuple] = {
    SortOption.newest: (Product.created_at.desc(), Product.id.desc()),
    SortOption.oldest: (Product.created_at.asc(), Product.id.asc()),
    SortOption.price_asc: (Product.price.asc(), Product.created_at.desc(), Product.id.desc()),
    SortOption.price_desc: (Product.price.desc(), Product.created_at.desc(), Product.id.desc()),
}


def escape_like(value: str) -> str:
    """LIKE joker karakterlerini kaçırır ( \\ önce gelmeli )."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def validate_title(title: str) -> str:
    cleaned = title.strip()
    if len(cleaned) < 3:
        raise HTTPException(status_code=400, detail="Başlık en az 3 karakter olmalı.")
    if len(cleaned) > MAX_TITLE_LENGTH:
        raise HTTPException(status_code=400, detail=f"Başlık en fazla {MAX_TITLE_LENGTH} karakter olabilir.")
    return cleaned


def validate_price(price: float) -> None:
    if price < 0:
        raise HTTPException(status_code=400, detail="Fiyat negatif olamaz.")
    if price > 10_000_000:
        raise HTTPException(status_code=400, detail="Fiyat çok yüksek.")


def validate_images(images: list[str] | None, image_url: str | None) -> list[str]:
    """Görsel listesini normalize eder. image_url geriye dönük uyumluluk içindir."""
    collected = list(images or [])
    if image_url and image_url not in collected:
        collected.insert(0, image_url)

    cleaned = [u.strip() for u in collected if u and u.strip()]
    if len(cleaned) > MAX_IMAGES:
        raise HTTPException(status_code=400, detail=f"En fazla {MAX_IMAGES} görsel ekleyebilirsiniz.")
    for url in cleaned:
        if len(url) > MAX_IMAGE_URL_LENGTH:
            raise HTTPException(
                status_code=400,
                detail="Görseller yükleme servisi üzerinden gönderilmeli (geçersiz görsel adresi).",
            )
        if not url.startswith(("http://", "https://")):
            raise HTTPException(status_code=400, detail="Geçersiz görsel adresi.")
    return cleaned


def build_product_out(product: Product, db: Session, current_user: User | None) -> ProductOut:
    comments_count = db.query(func.count(Comment.id)).filter(Comment.product_id == product.id).scalar()
    likes_count = db.query(func.count(Like.id)).filter(Like.product_id == product.id).scalar()

    is_liked = False
    is_favorited = False
    if current_user:
        is_liked = db.query(Like).filter(Like.user_id == current_user.id, Like.product_id == product.id).first() is not None
        is_favorited = db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.product_id == product.id).first() is not None

    return ProductOut(
        id=product.id,
        title=product.title,
        story=product.story,
        price=float(product.price),
        category=product.category,
        district=product.district,
        image_url=product.image_url,
        images=product.images or [],
        has_story=product.has_story,
        sold=product.sold,
        sold_date=product.sold_date,
        is_published=product.is_published,
        museum_status=product.museum_status,
        seller=SellerInfo.model_validate(product.seller),
        comments_count=comments_count,
        likes_count=likes_count,
        is_liked=is_liked,
        is_favorited=is_favorited,
        created_at=product.created_at,
    )


@router.get("/", response_model=ProductListResponse)
def list_products(
    category: str | None = None,
    district: str | None = None,
    q: str | None = Query(None, max_length=MAX_SEARCH_LENGTH),
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    sort: SortOption = SortOption.newest,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(status_code=400, detail="Minimum fiyat maksimumdan büyük olamaz.")

    query = db.query(Product).filter(Product.sold == False, Product.is_published == True)

    if category:
        query = query.filter(Product.category == category)
    if district:
        query = query.filter(Product.district == district)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if q and q.strip():
        # ILIKE joker karakterleri kullanıcı girdisinde kaçırılmalı; aksi hâlde
        # "%" araması tüm tabloyu döndürür.
        search = f"%{escape_like(q.strip())}%"
        query = query.filter(
            Product.title.ilike(search, escape="\\") | Product.story.ilike(search, escape="\\")
        )

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    products = (
        query.order_by(*SORT_CLAUSES[sort]).offset((page - 1) * limit).limit(limit).all()
    )

    items = [build_product_out(p, db, current_user) for p in products]
    return ProductListResponse(items=items, total=total, page=page, pages=pages)


@router.get("/museum", response_model=ProductListResponse)
def list_museum(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    query = db.query(Product).filter(Product.sold == True, Product.museum_status == "approved")
    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    products = query.order_by(Product.sold_date.desc()).offset((page - 1) * limit).limit(limit).all()

    items = [build_product_out(p, db, current_user) for p in products]
    return ProductListResponse(items=items, total=total, page=page, pages=pages)


@router.get("/favorites", response_model=list[ProductOut])
def list_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    favorites = (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )
    product_ids = [f.product_id for f in favorites]
    if not product_ids:
        return []

    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    # Favoriye eklenme sırasını koru (IN sorgusu sıralamayı garanti etmez).
    by_id = {p.id: p for p in products}
    ordered = [by_id[pid] for pid in product_ids if pid in by_id]
    return [build_product_out(p, db, current_user) for p in ordered]


@router.get("/mine", response_model=list[ProductOut])
def list_my_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Oturum sahibinin tüm ilanları (satılanlar dahil) — profil sayfası için."""
    products = (
        db.query(Product)
        .filter(Product.seller_id == current_user.id)
        .order_by(Product.created_at.desc())
        .all()
    )
    return [build_product_out(p, db, current_user) for p in products]


@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="İlan bulunamadı.")
    return build_product_out(product, db, current_user)


@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    title = validate_title(data.title)
    validate_price(data.price)
    images = validate_images(data.images, data.image_url)

    product = Product(
        title=title,
        story=data.story.strip(),
        price=data.price,
        category=data.category,
        district=data.district,
        image_url=images[0] if images else "",
        images=images,
        has_story=len(data.story.strip()) > 40,
        seller_id=current_user.id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return build_product_out(product, db, current_user)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="İlan bulunamadı.")
    if product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu ilanı düzenleme yetkiniz yok.")

    fields = data.model_dump(exclude_unset=True)

    if "title" in fields:
        product.title = validate_title(data.title or "")
    if "price" in fields and data.price is not None:
        validate_price(data.price)
        product.price = data.price
    if "category" in fields and data.category:
        product.category = data.category
    if "district" in fields and data.district:
        product.district = data.district
    if "story" in fields and data.story is not None:
        product.story = data.story.strip()
        product.has_story = len(product.story) > 40
    if "images" in fields or "image_url" in fields:
        images = validate_images(
            data.images if "images" in fields else product.images,
            data.image_url if "image_url" in fields else None,
        )
        product.images = images
        product.image_url = images[0] if images else ""

    db.commit()
    db.refresh(product)
    return build_product_out(product, db, current_user)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="İlan bulunamadı.")
    if product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu ilanı silme yetkiniz yok.")

    # likes/favorites/chats tabloları products.id'ye FK ile bağlı ama ORM cascade'i
    # yok — önce temizlenmezse DELETE, IntegrityError ile 500 döner.
    chat_ids = [c.id for c in db.query(Chat.id).filter(Chat.product_id == product.id).all()]
    if chat_ids:
        db.query(ChatMessage).filter(ChatMessage.chat_id.in_(chat_ids)).delete(synchronize_session=False)
        db.query(Chat).filter(Chat.id.in_(chat_ids)).delete(synchronize_session=False)
    db.query(Like).filter(Like.product_id == product.id).delete(synchronize_session=False)
    db.query(Favorite).filter(Favorite.product_id == product.id).delete(synchronize_session=False)

    # comments -> comment_likes cascade'i ORM üzerinden ilerlesin diye tek tek siliyoruz.
    for comment in db.query(Comment).filter(Comment.product_id == product.id).all():
        db.delete(comment)

    db.delete(product)
    db.commit()


@router.post("/{product_id}/sell", response_model=ProductOut)
def sell_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="İlan bulunamadı.")
    if product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok.")
    if product.sold:
        raise HTTPException(status_code=400, detail="Bu ilan zaten satılmış.")

    product.sold = True
    product.sold_date = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)
    return build_product_out(product, db, current_user)


@router.post("/{product_id}/museum-submit", response_model=ProductOut)
def submit_to_museum(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Satıcı ilanı Exift Müzesi'nde sergilemek ister — admin onayı bekler.

    Onay mekanizması (kim/nasıl onaylayacak) henüz kararlaştırılmadı (bkz.
    docs/missing-services/MUSEUM-APPROVAL.md); bu yüzden museum_status burada yalnızca
    "pending" olur, /museum listesine düşmesi için ayrıca onaylanması gerekir.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="İlan bulunamadı.")
    if product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok.")
    if not product.sold:
        raise HTTPException(status_code=400, detail="Yalnızca satılmış ilanlar müzeye gönderilebilir.")
    if product.museum_status in ("pending", "approved"):
        raise HTTPException(status_code=400, detail="Bu ilan zaten müzeye gönderilmiş.")

    product.museum_status = "pending"
    db.commit()
    db.refresh(product)
    return build_product_out(product, db, current_user)


@router.post("/{product_id}/unpublish", response_model=ProductOut)
def unpublish_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="İlan bulunamadı.")
    if product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok.")
    if product.sold:
        raise HTTPException(status_code=400, detail="Satılmış ilanlar yayından kaldırılamaz.")

    product.is_published = False
    db.commit()
    db.refresh(product)
    return build_product_out(product, db, current_user)


@router.post("/{product_id}/republish", response_model=ProductOut)
def republish_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="İlan bulunamadı.")
    if product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok.")
    if product.sold:
        raise HTTPException(status_code=400, detail="Satılmış ilanlar tekrar yayınlanamaz.")

    product.is_published = True
    db.commit()
    db.refresh(product)
    return build_product_out(product, db, current_user)


@router.post("/{product_id}/like", response_model=LikeResponse)
def toggle_like(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="İlan bulunamadı.")

    existing = db.query(Like).filter(Like.user_id == current_user.id, Like.product_id == product_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        liked = False
    else:
        db.add(Like(user_id=current_user.id, product_id=product_id))
        db.commit()
        liked = True

    likes_count = db.query(func.count(Like.id)).filter(Like.product_id == product_id).scalar()
    return LikeResponse(liked=liked, likes_count=likes_count)


@router.post("/{product_id}/favorite", response_model=FavoriteResponse)
def toggle_favorite(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="İlan bulunamadı.")

    existing = db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.product_id == product_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return FavoriteResponse(favorited=False)
    else:
        db.add(Favorite(user_id=current_user.id, product_id=product_id))
        db.commit()
        return FavoriteResponse(favorited=True)
