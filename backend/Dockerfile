FROM python:3.12-slim

# Ortam ayarları
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Bağımlılıklar (önce sadece requirements — katman önbelleği için)
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Uygulama kodu
COPY . .

EXPOSE 8000

# Migration'ları uygula, ardından sunucuyu başlat
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
