import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.utils.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


INVALID_TOKEN = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Geçersiz veya süresi dolmuş oturum.",
    headers={"WWW-Authenticate": "Bearer"},
)


def _resolve_user(token: str | None, db: Session) -> User | None:
    """Token'dan kullanıcıyı çözer. Bozuk token'da None döner (asla patlamaz)."""
    if not token:
        return None
    user_id = decode_access_token(token)
    if user_id is None:
        return None
    try:
        parsed_id = uuid.UUID(user_id)
    except (ValueError, AttributeError, TypeError):
        # "sub" geçerli bir UUID değil — 500 yerine kimliksiz kabul edilir.
        return None
    return db.query(User).filter(User.id == parsed_id).first()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    user = _resolve_user(token, db)
    if user is None:
        raise INVALID_TOKEN
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu hesap devre dışı bırakılmış.")
    return user


def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)
) -> User | None:
    user = _resolve_user(token, db)
    if user is not None and not user.is_active:
        return None
    return user
