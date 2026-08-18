from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, chats, comments, products, upload

app = FastAPI(
    title="Exift API",
    description="Exift pazar yeri backend API'si",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(comments.router)
app.include_router(chats.router)
app.include_router(upload.router)


@app.get("/")
def root():
    return {"message": "Exift API çalışıyor.", "docs": "/docs"}
