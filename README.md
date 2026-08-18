# Exift

**Geçmişi Sil, Yeni Başlangıçlara Yer Aç.**

Exift; ayrılıktan, eski bir ilişkiden ya da kapanan bir dönemden kalan eşyaları — her birinin
arkasındaki gerçek hikayeyle birlikte — satışa çıkarabileceğin bir pazar yeridir. Kullanıcılar
eşyalarını duygusal bir hikayeyle listeler, alıcılar hem ürünü hem de hikayesini satın alır;
satılan eşyaların hikayeleri ise **Exift Müzesi**'nde kalıcı olarak arşivlenir.

Proje iki parçadan oluşur: `src/` altındaki Next.js arayüzü ve `backend/` altındaki FastAPI
servisi. İkisi `/api/` önekli REST uçları üzerinden haberleşir.

## Teknoloji

| Katman | Kullanılanlar |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, lucide-react |
| Backend | FastAPI, SQLAlchemy 2, Alembic, Pydantic v2 |
| Veritabanı | PostgreSQL |
| Kimlik doğrulama | JWT (7 gün geçerli), bcrypt ile şifre hash'leme |
| Görsel barındırma | Cloudinary |

## Kurulum

Gereksinimler: Node.js 20+, Python 3.11+, çalışan bir PostgreSQL sunucusu.

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env      # değerleri kendine göre düzenle
alembic upgrade head
uvicorn app.main:app --reload
```

API [http://localhost:8000](http://localhost:8000) adresinde, etkileşimli dokümantasyon
[http://localhost:8000/docs](http://localhost:8000/docs) adresinde açılır. Ayrıntılar için
[`backend/README.md`](backend/README.md).

### 2. Frontend

```bash
npm install
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde açılır. Backend farklı bir
adreste çalışıyorsa kök dizine `.env.local` ekle:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Diğer komutlar:

```bash
npm run build   # üretim derlemesi
npm run start   # üretim sunucusu
npm run lint    # ESLint
```

## Sayfalar

| Yol | Açıklama |
|---|---|
| `/` | Vitrin: hero alanı, en çok konuşulan hikayeler, kategori/ilçe filtresi, arama |
| `/ilan/[id]` | İlan detayı: galeri, fiyat kutusu, satıcı kartı, hikaye, yorum ve beğeni |
| `/ilan-ver` | Üç adımlı ilan sihirbazı (ürün bilgileri → fotoğraf → hikaye) |
| `/muze` | Exift Müzesi: satılmış eşyaların kalıcı hikaye arşivi |
| `/sandik` | Exift Sandığı: kaydedilen ilanlar (giriş gerektirir) |
| `/sohbet/[chatId]` | Alıcı-satıcı mesajlaşması |
| `/profil` | Sekmeli profil: ilanlarım, satılanlar, sandığım, sohbetler, ayarlar |
| `/auth/sign-in`, `/auth/sign-up` | Giriş ve kayıt |

`/favoriler` yolu `/sandik` adresine yönlendirir; eski bağlantılar kırılmasın diye korunmuştur.

## Proje Yapısı

```
src/
  app/                 # Next.js App Router sayfaları
  components/
    layout/            # Header, Footer, MobileBottomNav, SoftGateBar
    product/           # ProductCard, ProductGrid, CommentSection, HeroSection, ...
    auth/              # AuthForm (giriş + kayıt)
    ui/                # SandikIcon
  context/
    AppDataContext.tsx # Uygulama durumu; backend'e api.ts üzerinden bağlanır
    AuthGateContext.tsx
    ToastContext.tsx
    Providers.tsx
  data/                # Statik içerik (site-config, categories, districts)
  lib/                 # api, format, categories, icons, storage
  types/               # Paylaşılan TypeScript tipleri

backend/
  app/
    routers/           # auth, products, comments, chats, upload
    models/            # SQLAlchemy tabloları
    schemas/           # Pydantic şemaları
    utils/             # security, cloudinary, phone
    config.py          # Ortam değişkenleri
    database.py
    dependencies.py
    main.py
  alembic/versions/    # Veritabanı migration'ları
```

`src/data/` altındaki JSON dosyaları artık mock veritabanı değildir; yalnızca kategori listesi,
İstanbul ilçeleri ve site metinleri gibi statik içeriği tutar. Ürün, kullanıcı, yorum ve mesaj
verilerinin tamamı backend'den gelir.

## API Özeti

| Yöntem | Uç | Açıklama |
|---|---|---|
| `POST` | `/api/auth/register` | Kayıt (telefon doğrulaması yapılır) |
| `POST` | `/api/auth/login` | Giriş, JWT döner |
| `GET` `PUT` | `/api/auth/me` | Profil görüntüleme ve güncelleme |
| `POST` | `/api/auth/change-password` | Şifre değiştirme |
| `GET` `POST` | `/api/products` | İlan listesi (kategori, ilçe, arama, sayfalama) ve oluşturma |
| `GET` | `/api/products/museum` | Satılmış ilanlar |
| `GET` | `/api/products/favorites` | Kullanıcının sandığı |
| `GET` `PUT` `DELETE` | `/api/products/{id}` | Tekil ilan işlemleri |
| `POST` | `/api/products/{id}/sell` | İlanı satıldı işaretle, müzeye taşı |
| `POST` | `/api/products/{id}/like` | Beğeni aç/kapat |
| `POST` | `/api/products/{id}/favorite` | Sandığa ekle/çıkar |
| `GET` `POST` | `/api/products/{id}/comments` | Yorum listeleme ve ekleme |
| `POST` | `/api/comments/{id}/like` | Yorum beğenisi aç/kapat |
| `DELETE` | `/api/comments/{id}` | Yorum silme |
| `POST` | `/api/chats/contact/{product_id}` | Satıcıyla sohbet başlat |
| `GET` | `/api/chats` | Sohbet listesi |
| `GET` `POST` | `/api/chats/{id}` | Sohbet detayı ve mesaj gönderme |
| `POST` | `/api/upload/image` | Cloudinary'ye görsel yükleme |

Tam ve güncel liste `/docs` adresindeki otomatik dokümantasyonda bulunur.

## Belgeler

- [`backend/README.md`](backend/README.md) — backend kurulumu, migration'lar, doğrulama kuralları
- [`eklenmesi-gerekenler.md`](eklenmesi-gerekenler.md) — hakkımızda, kullanım koşulları ve
  gizlilik politikası metinleri; henüz sayfaya dönüştürülmedi
- [`AGENTS.md`](AGENTS.md) / [`CLAUDE.md`](CLAUDE.md) — yapay zeka araçları için proje kuralları
