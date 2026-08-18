import cloudinary
import cloudinary.uploader

from app.config import settings

# Klasör başına dönüşüm ayarları — avatarlar kare kırpılır, ürünler oranını korur.
FOLDER_TRANSFORMATIONS: dict[str, list[dict]] = {
    "products": [{"width": 1200, "height": 1200, "crop": "limit", "quality": "auto"}],
    "avatars": [{"width": 400, "height": 400, "crop": "fill", "gravity": "face", "quality": "auto"}],
}


def configure_cloudinary():
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


def upload_bytes(contents: bytes, folder: str = "products") -> dict:
    """Okunmuş dosya içeriğini Cloudinary'ye yükler ve güvenli URL'i döner."""
    configure_cloudinary()
    result = cloudinary.uploader.upload(
        contents,
        folder=f"exift/{folder}",
        resource_type="image",
        transformation=FOLDER_TRANSFORMATIONS.get(folder, FOLDER_TRANSFORMATIONS["products"]),
    )
    return {"url": result["secure_url"], "public_id": result["public_id"]}
