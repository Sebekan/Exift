from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel

from app.config import settings
from app.dependencies import get_current_user
from app.models.user import User
from app.utils.cloudinary import upload_bytes

router = APIRouter(prefix="/api/upload", tags=["upload"])

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"}


class UploadResponse(BaseModel):
    url: str
    public_id: str


@router.post("/image", response_model=UploadResponse)
async def upload_image_endpoint(
    file: UploadFile,
    folder: str = "products",
    current_user: User = Depends(get_current_user),
):
    if not settings.cloudinary_configured:
        raise HTTPException(
            status_code=503,
            detail="Görsel yükleme servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
        )

    if not file.content_type or file.content_type.lower() not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Sadece JPG, PNG, WebP veya GIF yükleyebilirsiniz.")

    if folder not in ("products", "avatars"):
        raise HTTPException(status_code=400, detail="Geçersiz yükleme klasörü.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Dosya boş.")
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Dosya boyutu 5MB'ı aşamaz.")

    try:
        result = upload_bytes(contents, folder=folder)
    except Exception:
        # Cloudinary'nin ham hatası kullanıcıya sızdırılmaz.
        raise HTTPException(status_code=502, detail="Görsel yüklenemedi. Lütfen tekrar deneyin.")

    return UploadResponse(url=result["url"], public_id=result["public_id"])
