@AGENTS.md

# Proje: Exift

Next.js 16 pazar yeri uygulaması (React 19, TypeScript, Tailwind CSS v4) + FastAPI backend (PostgreSQL, JWT auth, Cloudinary).

## Komutlar

### Frontend
- `npm run dev` — Geliştirme sunucusunu başlat (Turbopack)
- `npm run build` — Üretim derlemesi
- `npm run lint` — ESLint kontrolü

### Backend
- `cd backend && pip install -r requirements.txt` — Bağımlılıkları kur
- `cd backend && uvicorn app.main:app --reload` — Geliştirme sunucusu (port 8000)
- `cd backend && alembic upgrade head` — Veritabanı migration'larını uygula

## Mimari

- Frontend sayfalar client component'tir (`"use client"`).
- `src/context/AppDataContext.tsx` backend API'ye bağlanır (`src/lib/api.ts` üzerinden).
- Backend: FastAPI + SQLAlchemy + Alembic (PostgreSQL).
- Auth: JWT token, localStorage'da saklanır.
- Tailwind v4, `globals.css` içinde `@theme inline` direktifi ile yapılandırılmış.
- `src/data/*.json` yalnızca statik içerik tutar (kategoriler, ilçeler, site metinleri); ürün ve
  kullanıcı verileri backend'den gelir.

## Kurallar

- Yol kısayolu: `@/*` → `./src/*`
- Tüm arayüz metinleri Türkçe
- İkonlar: yalnızca lucide-react. Tek istisna marka/sosyal medya ikonlarıdır — lucide
  bunları kütüphaneden çıkardı; `src/components/ui/BrandIcons.tsx` içinde lucide'ın çizim
  diliyle (24 viewBox, stroke 2, yuvarlak uç) elle tutulur
- Backend API prefix: `/api/`
- Frontend env: `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`)
- Telefon numaraları `phonenumbers` ile doğrulanır ve E164 biçiminde saklanır
  (`app/utils/phone.py`)
- Hata mesajları `detail` alanında Türkçe döner; frontend bunu doğrudan gösterir

## Belgeler

- `README.md` — proje tanıtımı, kurulum, sayfa ve API özeti
- `backend/README.md` — backend kurulumu, migration'lar, doğrulama kuralları
