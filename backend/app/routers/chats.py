import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.chat import Chat
from app.models.chat_message import ChatMessage
from app.models.product import Product
from app.models.user import User

router = APIRouter(prefix="/api/chats", tags=["chats"])

MAX_MESSAGE_LENGTH = 2000


class ChatResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_title: str
    product_image: str
    product_price: float
    product_sold: bool
    seller_nickname: str
    # Karşı taraf, oturum sahibine göre değişir; UI her zaman bunu göstermeli.
    other_party_id: uuid.UUID
    other_party_nickname: str
    other_party_avatar_url: str | None
    # Oturum sahibi ilanın sahibi mi — "Düzenle" aksiyonunu bu belirler.
    is_seller: bool
    last_message: str
    last_message_at: datetime

    model_config = {"from_attributes": True}


class ChatMessageOut(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    text: str
    created_at: datetime
    is_mine: bool


class ChatDetailResponse(ChatResponse):
    messages: list[ChatMessageOut]


class SendMessageRequest(BaseModel):
    text: str


def _get_authorized_chat(chat_id: uuid.UUID, db: Session, current_user: User) -> Chat:
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı.")
    if current_user.id not in (chat.buyer_id, chat.seller_id):
        raise HTTPException(status_code=403, detail="Bu sohbete erişiminiz yok.")
    return chat


def build_chat_response(chat: Chat, product: Product, db: Session, current_user: User) -> ChatResponse:
    is_seller = current_user.id == chat.seller_id
    other_party_id = chat.buyer_id if is_seller else chat.seller_id
    other_party = db.query(User).filter(User.id == other_party_id).first()

    return ChatResponse(
        id=chat.id,
        product_id=product.id,
        product_title=product.title,
        product_image=product.image_url,
        product_price=float(product.price),
        product_sold=product.sold,
        seller_nickname=product.seller.nickname,
        other_party_id=other_party_id,
        other_party_nickname=other_party.nickname if other_party else "Silinmiş kullanıcı",
        other_party_avatar_url=other_party.avatar_url if other_party else None,
        is_seller=is_seller,
        last_message=chat.last_message,
        last_message_at=chat.last_message_at,
    )


@router.post("/contact/{product_id}", response_model=ChatResponse)
def contact_seller(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="İlan bulunamadı.")
    if product.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendi ilanınızla iletişime geçemezsiniz.")

    existing = db.query(Chat).filter(
        Chat.buyer_id == current_user.id, Chat.product_id == product_id
    ).first()
    if existing:
        return build_chat_response(existing, product, db, current_user)

    opening_message = "Merhaba, bu anı hâlâ satılık mı?"
    chat = Chat(
        buyer_id=current_user.id,
        seller_id=product.seller_id,
        product_id=product.id,
        last_message=opening_message,
    )
    db.add(chat)
    db.flush()
    db.add(ChatMessage(chat_id=chat.id, sender_id=current_user.id, text=opening_message))
    db.commit()
    db.refresh(chat)

    return build_chat_response(chat, product, db, current_user)


@router.get("/", response_model=list[ChatResponse])
def list_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chats = (
        db.query(Chat)
        .filter((Chat.buyer_id == current_user.id) | (Chat.seller_id == current_user.id))
        .order_by(Chat.last_message_at.desc())
        .all()
    )
    if not chats:
        return []

    # Sohbet başına ürün sorgusu atmak yerine tek seferde çekiyoruz (N+1 önlemi).
    product_ids = {c.product_id for c in chats}
    products = {p.id: p for p in db.query(Product).filter(Product.id.in_(product_ids)).all()}

    return [
        build_chat_response(chat, products[chat.product_id], db, current_user)
        for chat in chats
        if chat.product_id in products
    ]


@router.get("/{chat_id}", response_model=ChatDetailResponse)
def get_chat(
    chat_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chat = _get_authorized_chat(chat_id, db, current_user)
    product = db.query(Product).filter(Product.id == chat.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="İlan bulunamadı.")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.chat_id == chat.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    base = build_chat_response(chat, product, db, current_user)
    return ChatDetailResponse(
        **base.model_dump(),
        messages=[
            ChatMessageOut(
                id=m.id,
                sender_id=m.sender_id,
                text=m.text,
                created_at=m.created_at,
                is_mine=m.sender_id == current_user.id,
            )
            for m in messages
        ],
    )


@router.post("/{chat_id}/messages", response_model=ChatMessageOut, status_code=201)
def send_message(
    chat_id: uuid.UUID,
    data: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chat = _get_authorized_chat(chat_id, db, current_user)
    text = data.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Mesaj boş olamaz.")
    if len(text) > MAX_MESSAGE_LENGTH:
        raise HTTPException(
            status_code=400, detail=f"Mesaj en fazla {MAX_MESSAGE_LENGTH} karakter olabilir."
        )

    message = ChatMessage(chat_id=chat.id, sender_id=current_user.id, text=text)
    db.add(message)
    chat.last_message = text
    chat.last_message_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(message)

    return ChatMessageOut(
        id=message.id,
        sender_id=message.sender_id,
        text=message.text,
        created_at=message.created_at,
        is_mine=True,
    )
