import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_current_user_optional
from app.models.comment import Comment, CommentLike
from app.models.product import Product
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentLikeResponse, CommentOut

router = APIRouter(tags=["comments"])


@router.get("/api/products/{product_id}/comments", response_model=list[CommentOut])
def list_comments(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="İlan bulunamadı.")

    comments = (
        db.query(Comment)
        .filter(Comment.product_id == product_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    if not comments:
        return []

    comment_ids = [c.id for c in comments]

    # Yorum başına ayrı COUNT sorgusu yerine tek gruplu sorgu (N+1 önlemi).
    like_counts = dict(
        db.query(CommentLike.comment_id, func.count(CommentLike.id))
        .filter(CommentLike.comment_id.in_(comment_ids))
        .group_by(CommentLike.comment_id)
        .all()
    )

    liked_ids: set[uuid.UUID] = set()
    if current_user:
        liked_ids = {
            row[0]
            for row in db.query(CommentLike.comment_id)
            .filter(
                CommentLike.comment_id.in_(comment_ids),
                CommentLike.user_id == current_user.id,
            )
            .all()
        }

    return [
        CommentOut(
            id=c.id,
            author_id=c.author_id,
            author_nickname=c.author.nickname,
            author_avatar_url=c.author.avatar_url,
            text=c.text,
            likes_count=like_counts.get(c.id, 0),
            is_liked=c.id in liked_ids,
            is_mine=current_user is not None and c.author_id == current_user.id,
            created_at=c.created_at,
        )
        for c in comments
    ]


@router.post("/api/products/{product_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(
    product_id: uuid.UUID,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="İlan bulunamadı.")
    text = data.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Yorum metni boş olamaz.")
    if len(text) > 1000:
        raise HTTPException(status_code=400, detail="Yorum en fazla 1000 karakter olabilir.")

    comment = Comment(
        product_id=product_id,
        author_id=current_user.id,
        text=text,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return CommentOut(
        id=comment.id,
        author_id=current_user.id,
        author_nickname=current_user.nickname,
        author_avatar_url=current_user.avatar_url,
        text=comment.text,
        likes_count=0,
        is_liked=False,
        is_mine=True,
        created_at=comment.created_at,
    )


@router.post("/api/comments/{comment_id}/like", response_model=CommentLikeResponse)
def toggle_comment_like(
    comment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı.")

    existing = db.query(CommentLike).filter(
        CommentLike.user_id == current_user.id, CommentLike.comment_id == comment_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        liked = False
    else:
        db.add(CommentLike(user_id=current_user.id, comment_id=comment_id))
        db.commit()
        liked = True

    likes_count = db.query(func.count(CommentLike.id)).filter(CommentLike.comment_id == comment_id).scalar()
    return CommentLikeResponse(liked=liked, likes_count=likes_count)


@router.delete("/api/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı.")
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu yorumu silme yetkiniz yok.")
    db.delete(comment)
    db.commit()
