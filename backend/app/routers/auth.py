import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.utils.email import send_verification_email
from app.utils.phone import normalize_phone
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import (
    AuthResponse,
    ChangePassword,
    EmailVerifyRequest,
    UserLogin,
    UserOut,
    UserRegister,
    UserUpdate,
)
from app.utils.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

VERIFICATION_TOKEN_TTL = timedelta(hours=24)


def _issue_verification_token(user: User) -> str:
    token = secrets.token_urlsafe(32)
    user.verification_token = token
    user.verification_token_expires_at = datetime.now(timezone.utc) + VERIFICATION_TOKEN_TTL
    return token


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    nickname = data.nickname.strip()
    email = data.email.strip().lower()

    if not 3 <= len(nickname) <= 30:
        raise HTTPException(status_code=400, detail="Kullanıcı adı 3-30 karakter arasında olmalı.")
    if db.query(User).filter(func.lower(User.email) == email).first():
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kayıtlı.")
    if db.query(User).filter(func.lower(User.nickname) == nickname.lower()).first():
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış.")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalı.")

    phone = None
    if data.phone:
        try:
            phone = normalize_phone(data.phone)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        if db.query(User).filter(User.phone == phone).first():
            raise HTTPException(status_code=400, detail="Bu telefon numarası zaten kayıtlı.")
    user = User(
        nickname=nickname,
        email=email,
        password_hash=hash_password(data.password),
        phone=phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # E-posta doğrulama: altyapı hazır ama gönderim sağlayıcısı henüz
    # bağlanmadı (bkz. docs/missing-services/AUTH.md) — bu yüzden hesap
    # oluşturma/giriş bu adıma bağlı değil.
    verification_token = _issue_verification_token(user)
    db.commit()
    send_verification_email(user.email, verification_token)

    token = create_access_token(str(user.id))
    return AuthResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Bu hesap devre dışı bırakılmış.")

    token = create_access_token(str(user.id))
    return AuthResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.put("/me", response_model=UserOut)
def update_me(data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.nickname is not None:
        nickname = data.nickname.strip()
        if not 3 <= len(nickname) <= 30:
            raise HTTPException(status_code=400, detail="Kullanıcı adı 3-30 karakter arasında olmalı.")
        existing = (
            db.query(User)
            .filter(func.lower(User.nickname) == nickname.lower(), User.id != current_user.id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış.")
        current_user.nickname = nickname
    if data.bio is not None:
        if len(data.bio) > 300:
            raise HTTPException(status_code=400, detail="Biyografi en fazla 300 karakter olabilir.")
        current_user.bio = data.bio.strip()
    if data.avatar_url is not None:
        # Boş string avatarı kaldırmak için kullanılır.
        current_user.avatar_url = data.avatar_url.strip() or None
    if data.phone is not None:
        try:
            phone = normalize_phone(data.phone)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        existing_phone = db.query(User).filter(User.phone == phone, User.id != current_user.id).first()
        if existing_phone:
            raise HTTPException(status_code=400, detail="Bu telefon numarası zaten kayıtlı.")
        current_user.phone = phone
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.post("/change-password")
def change_password(data: ChangePassword, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı.")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Yeni şifre en az 6 karakter olmalı.")
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"detail": "Şifre başarıyla değiştirildi."}


@router.post("/verify-email", response_model=UserOut)
def verify_email(data: EmailVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == data.token).first()
    if not user or not user.verification_token_expires_at:
        raise HTTPException(status_code=400, detail="Geçersiz doğrulama bağlantısı.")
    if user.verification_token_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Doğrulama bağlantısının süresi dolmuş.")

    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires_at = None
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.post("/resend-verification")
def resend_verification(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.is_verified:
        raise HTTPException(status_code=400, detail="Hesabın zaten doğrulanmış.")
    token = _issue_verification_token(current_user)
    db.commit()
    send_verification_email(current_user.email, token)
    return {"detail": "Doğrulama bağlantısı gönderildi."}
