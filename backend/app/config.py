from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/exift"

    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_db_url(cls, v: str) -> str:
        # Coolify/Heroku "postgres://" verir; SQLAlchemy 2.0 "postgresql://" ister.
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    JWT_SECRET_KEY: str = "dev-secret-key-degistir"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 gün

    # Gizli anahtarların kaynağı yalnızca ortam değişkenleridir; koda gömülmez.
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    APP_ENV: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() in ("production", "prod")

    @property
    def cloudinary_configured(self) -> bool:
        return all(
            [self.CLOUDINARY_CLOUD_NAME, self.CLOUDINARY_API_KEY, self.CLOUDINARY_API_SECRET]
        )

    class Config:
        env_file = ".env"


settings = Settings()

if settings.is_production and settings.JWT_SECRET_KEY == "dev-secret-key-degistir":
    raise RuntimeError(
        "APP_ENV=production iken JWT_SECRET_KEY ortam değişkeni mutlaka ayarlanmalıdır."
    )
