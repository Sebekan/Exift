# Architecture

Exift; Next.js 16 (App Router, React 19) tabanlı bir istemci ile FastAPI +
PostgreSQL tabanlı bir API'den oluşan bir pazar yeri uygulamasıdır.

---

## Veri akışı

```
                          Kullanıcı
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│  UI  ·  src/app/**/page.tsx                             │
│        rota + düzen, "use client"                       │
├─────────────────────────────────────────────────────────┤
│  Feature Component  ·  src/components/{product,profile, │
│        chat,auth}/  — ekran parçaları                   │
├─────────────────────────────────────────────────────────┤
│  Design System  ·  src/components/ui/                   │
│        Button · Field · Modal · Tabs · States           │
├─────────────────────────────────────────────────────────┤
│  Hook  ·  src/hooks/                                    │
│        useAsyncData · usePaginatedListings              │
│        useDebounced · useResettableState                │
├─────────────────────────────────────────────────────────┤
│  Service Layer  ·  src/services/                        │
│        auth · listing · comment · chat · upload         │
│        + mappers (snake_case → camelCase)               │
├─────────────────────────────────────────────────────────┤
│  API Client  ·  src/lib/api/client.ts                   │
│        base URL · token · timeout · abort               │
│        401 yayını · hata normalizasyonu                 │
└─────────────────────────────────────────────────────────┘
                              │  HTTPS / JSON
                              ▼
┌─────────────────────────────────────────────────────────┐
│  Router  ·  backend/app/routers/                        │
│        auth · products · comments · chats · upload      │
├─────────────────────────────────────────────────────────┤
│  Dependency  ·  backend/app/dependencies.py             │
│        get_current_user · get_current_user_optional      │
│        → kimlik doğrulama + sahiplik kapısı             │
├─────────────────────────────────────────────────────────┤
│  Schema  ·  backend/app/schemas/  (Pydantic)            │
│        istek/yanıt sözleşmesi + doğrulama               │
├─────────────────────────────────────────────────────────┤
│  Model  ·  backend/app/models/  (SQLAlchemy 2.0)        │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL                                             │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                   Cloudinary (görsel deposu)
```

---

## Klasör yapısı

```
exift/
├── src/
│   ├── app/                        # App Router rotaları (hepsi client component)
│   │   ├── page.tsx                # Anasayfa — arama, kategori, sayfalama
│   │   ├── ilan/[id]/page.tsx      # İlan detayı — sahip/ziyaretçi aksiyonları
│   │   ├── ilan/[id]/duzenle/      # İlan düzenleme (sahiplik korumalı)
│   │   ├── ilan-ver/               # İlan oluşturma
│   │   ├── profil/                 # Profil — ilanlar, favoriler, sohbet, ayarlar
│   │   ├── sohbet/[chatId]/        # Sohbet dizisi
│   │   ├── sandik/ · muze/         # Favoriler · satılmış arşiv
│   │   ├── giris/ · kayit/         # Türkçe auth rotaları
│   │   ├── mesajlar/               # sohbet listesi
│   │   ├── hakkimizda/ · kullanim-kosullari/ · gizlilik-politikasi/
│   │   ├── layout.tsx              # Kök düzen + skip link
│   │   └── globals.css             # Tema, animasyon dili, erişilebilirlik
│   │
│   ├── components/
│   │   ├── ui/                     # Design system (ekran bilgisi taşımaz)
│   │   ├── product/                # Kart, grid, galeri, form, yükleyici, yorum,
│   │   │                           # FilterBar/FilterPanel/ActiveFilters, Stepper
│   │   ├── profile/                # Başlık, kenar çubuğu, ayarlar
│   │   ├── chat/                   # Sohbet listesi
│   │   ├── auth/                   # AuthForm, PhoneField, RequireAuth
│   │   └── layout/                 # Header, Footer, MobileBottomNav,
│   │                               # SoftGateBar, Container, UserMenu, LegalPage
│   │
│   ├── services/                   # Backend sözleşmesi → domain modeli
│   ├── lib/
│   │   ├── api/                    # client · errors · types (backend sözleşmesi)
│   │   ├── ownership.ts            # ⭐ sahiplik kararlarının TEK kaynağı
│   │   ├── filters.ts              # ⭐ filtre sözleşmesi (URL ↔ model)
│   │   ├── validation.ts           # form kuralları (backend sınırlarıyla eşleşir)
│   │   ├── phone.ts                # E.164 ülke kodu + doğrulama
│   │   ├── format.ts · cn.ts · categories.ts · icons.ts
│   │   ├── hooks/                  # (bkz. src/hooks)
│   │   └── storage.ts
│   ├── hooks/                      # useAsyncData · usePaginatedListings ·
│   │                               # useListingFilters · useDebounced · useResettableState
│   ├── context/                    # AppData · AuthGate · Toast · Providers
│   ├── types/                      # domain modelleri (camelCase)
│   └── data/                       # statik içerik: kategoriler, ilçeler, site metni
│
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app + CORS
│   │   ├── config.py               # ayarlar (gizli anahtarlar yalnızca env'den)
│   │   ├── database.py · dependencies.py
│   │   ├── models/ · schemas/ · routers/ · utils/
│   │   └── services/               # (şu an boş — bkz. Scalability)
│   ├── alembic/versions/           # migration'lar
│   └── tests/smoke_test.py         # uçtan uca duman testi
│
└── docs/
    ├── AUDIT.md · ARCHITECTURE.md
    └── missing-services/*.md
```

---

## Service layer

**Kural:** Bileşenler `fetch` çağırmaz. Her ağ erişimi `src/services/`
üzerinden geçer.

```
Component  →  hook  →  service  →  http client  →  API
```

Servisler backend'in `snake_case` sözleşmesini (`src/lib/api/types.ts`) alır ve
domain modeline (`src/types/index.ts`, camelCase) çevirir. Çeviri tek yerdedir:
`src/services/mappers.ts`. Bu sayede backend alan adı değişikliği tek dosyada
karşılanır.

| Servis | Sorumluluk |
| --- | --- |
| `auth.service` | kayıt, giriş, oturum, profil, şifre |
| `listing.service` | ilan CRUD, favori, beğeni, satıldı |
| `comment.service` | yorum listeleme/ekleme/beğeni/silme |
| `chat.service` | sohbet listesi, dizi, mesaj |
| `upload.service` | Cloudinary yükleme + yerel doğrulama |

---

## API client

`src/lib/api/client.ts` tek giriş noktasıdır ve şunları yönetir:

| Sorumluluk | Uygulama |
| --- | --- |
| Base URL | `NEXT_PUBLIC_API_URL` (varsayılan `http://localhost:8000`) |
| Token | `localStorage["exift-token"]`, her istekte `Authorization: Bearer` |
| Timeout | 20 sn (yükleme 60 sn), `AbortSignal.any` ile |
| İptal | Çağıranın `signal`'i ile birleştirilir |
| 401 | `notifyUnauthorized()` → token silinir, abone context oturumu düşürür |
| Hata | Her hata `ApiError`'a normalize edilir |

### Hata yönetimi

```
HTTP durumu / ağ hatası
        │
        ▼
  ApiError { status, kind, detail }
        │  kind: validation | unauthorized | forbidden | not_found
        │        | conflict | rate_limited | server | network | timeout
        ▼
  toUserMessage(error)          ← src/lib/api/errors.ts
        │  backend `detail` Türkçe ise doğrudan kullanılır,
        │  yoksa `kind` bazlı kullanıcı dostu yedek mesaj
        ▼
  InlineAlert · ErrorState · Toast
```

Bileşenler **asla** `error.message` göstermez; hepsi `toUserMessage()` üzerinden
geçer. FastAPI'nin üç `detail` biçimi de (string, Pydantic dizisi, nesne)
`extractDetail()` içinde ele alınır.

---

## State management

State bilinçli olarak dört kategoriye ayrılmıştır. **Her şey global değildir.**

| Tür | Nerede | Örnek |
| --- | --- | --- |
| **Oturum state** | `AppDataContext` | `profile`, `status` |
| **Kullanıcıya özel koleksiyon** | `AppDataContext` | favori/beğeni id'leri, kendi ilanları, sohbetler |
| **Sunucu state (sayfaya özel)** | `useAsyncData` / `usePaginatedListings` | ilan listesi, ilan detayı, yorumlar |
| **UI state** | Bileşen içi `useState` | açık modal, aktif sekme, galeri indeksi |
| **Form state** | Bileşen içi | `ListingForm`, `AuthForm`, `ProfileSettings` |

> **Önemli tasarım kararı:** Ürün listeleri context'te **tutulmaz**. Önceki
> mimari tüm ürünleri global state'e doldurup her sayfada istemci tarafında
> filtreliyordu; bu hem bayat veri hem de gereksiz yük üretiyordu. Artık her
> sayfa kendi verisini çeker, backend filtreler.

Favori/beğeni id'leri context'te tutulur çünkü **birden çok ekranda** (kart,
detay, sandık) aynı anda görünür ve iyimser güncellemenin tek bir doğruluk
kaynağı olması gerekir.

---

## Filter architecture

Filtrelerin **tek doğruluk kaynağı URL'dir.** localStorage, sessionStorage veya
global state kullanılmaz.

```
URL (?q=&kategori=&konum=&minFiyat=&maxFiyat=&sirala=)
      │  parseFilters()          ← geçersiz değerler sessizce düşer
      ▼
ListingFilters  ──► toChips()  ──►  ActiveFilters (kaldırılabilir chip'ler)
      │                              │ removeChip / clearAll
      │  toQuery()                   ▼
      ▼                        buildSearchParams() ──► router.replace()
listingService.list()
```

| Karar | Gerekçe |
| --- | --- |
| State URL'de | Paylaşılabilir/yer imlenebilir liste; geri-ileri bedava çalışır; "gizli kalmış filtre" durumu yapısal olarak imkânsız |
| `replace`, `push` değil | Her filtre değişikliği geçmişe kayıt eklerse geri tuşu kullanıcıyı filtreler arasında hapseder |
| Varsayılanlar yazılmaz | `?sirala=newest` gibi gürültü birikmez; temiz liste `/` adresinde kalır |
| Sıralama filtre sayılmaz | Chip üretmez, "Tümünü Temizle" sıralamayı korur — kullanıcı onu kastetmiyor |
| Profil bölümü de URL'de (`?bolum=`) | Header menüsünden derin bağlantı; geri tuşu bölümler arasında çalışır |
| Giriş hedefi `?to=` | Kısa ve okunur; `safeRedirect()` yalnızca site içi yolları kabul eder |
| Fiyat tek chip | `minFiyat`+`maxFiyat` kavramsal olarak tek aralık; iki ayrı chip kafa karıştırır |
| Fiyat blur/Enter'da uygulanır | Her tuş vuruşunda URL yazmak geçmişi ve istekleri şişirir |
| Arama 450ms debounce | Yazarken istek yağmuru olmaz |

Aynı `FilterPanel` bileşeni masaüstünde yan panel, mobilde drawer olarak
kullanılır — iki filtre arayüzünün zamanla ayrışmasını önler.

## Authentication flow

```
KAYIT / GİRİŞ
  form → doğrulama → authService → POST /api/auth/{register,login}
  → { access_token, user } → setToken() → context: status="authenticated"
  → kullanıcı verileri paralel yüklenir (favoriler, ilanlar, sohbetler)
  → safeRedirect(?redirect) ile yönlendirme

OTURUM GERİ YÜKLEME (sayfa yenileme)
  status = "loading"                    ← RequireAuth burada YÖNLENDİRMEZ
  token var mı? ─ hayır → status = "anonymous"
                └ evet  → GET /api/auth/me
                          ├ 200 → status = "authenticated"
                          └ 401 → token sil → status = "anonymous"

OTURUM SONA ERMESİ (herhangi bir istek sırasında)
  herhangi bir 401 → client.notifyUnauthorized()
  → token silinir → context aboneliği → resetSession()
  → korumalı sayfadaysa RequireAuth girişe yönlendirir
```

`RequireAuth`'ın üç durumu ayırt etmesi kritiktir: `loading` sırasında
yönlendirme yapılırsa kullanıcı her sayfa yenilemesinde girişe atılır.

---

## Authorization

İki katman vardır ve **yalnızca ikincisi güvenlik sağlar**:

| Katman | Yer | Amaç |
| --- | --- | --- |
| UI kapısı | `src/lib/ownership.ts` | Hangi butonun gösterileceği |
| **Gerçek yetki** | `backend/app/routers/*` | Erişim kararı |

```python
# backend/app/routers/products.py
if product.seller_id != current_user.id:
    raise HTTPException(403, "Bu ilanı düzenleme yetkiniz yok.")
```

`getProductActions(product, user)` tek fonksiyondur ve şu kararları verir:

| Aksiyon | Koşul |
| --- | --- |
| `canEdit` / `canDelete` / `canMarkSold` | sahip **ve** satılmamış |
| `canContact` | sahip değil **ve** satılmamış |
| `canFavorite` / `canLike` | sahip değil |

İstemci kontrolünün atlatılması hiçbir yetki kazandırmaz — backend her yazma
işleminde sahipliği yeniden doğrular (duman testi bölüm 5 bunu kanıtlar).

---

## File upload

```
Kullanıcı dosya seçer
   → validateImageFile()       # istemci: tip + 5MB (hızlı geri bildirim)
   → POST /api/upload/image?folder=products|avatars   (multipart, JWT)
   → backend: MIME beyaz listesi + 5MB + klasör beyaz listesi
   → Cloudinary (products: 1200px limit · avatars: 400px kare, yüz odaklı)
   → { url, public_id }
   → state'te YALNIZCA kalıcı https URL tutulur
   → ilan/profil kaydında bu URL gönderilir
```

Görsel URL'leri asla base64 data URI olmaz; `image_url` sütunu `String(500)`
olduğu için backend uzun/şemasız URL'leri `400` ile reddeder.

`next.config.ts` `res.cloudinary.com`'a izin verir — bu olmadan `next/image`
üretimdeki tüm kullanıcı görsellerini reddeder.

---

## Routing

| Rota | Tür | Koruma |
| --- | --- | --- |
| `/` | Static | — |
| `/ilan/[id]` | Dynamic | — (sahiplik aksiyonları koşullu) |
| `/ilan/[id]/duzenle` | Dynamic | `RequireAuth` + sahiplik + satılmamış |
| `/ilan-ver` | Static | `RequireAuth` |
| `/profil` | Static | `RequireAuth` |
| `/sohbet/[chatId]` | Dynamic | `RequireAuth` + backend katılımcı kontrolü |
| `/sandik` | Static | `RequireAuth` |
| `/muze` | Static | — |
| `/giris` · `/kayit` | Static | girişliyse `?to=` hedefine yönlendirir |
| `/mesajlar` | Static | `RequireAuth` |
| `/hakkimizda` · `/kullanim-kosullari` · `/gizlilik-politikasi` | Static | — |

---

## Environment

### Frontend (`.env.local`)
| Değişken | Varsayılan | Not |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | `NEXT_PUBLIC_` = tarayıcıya açık; **gizli değer koyulmaz** |

### Backend (`backend/.env`)
| Değişken | Zorunlu | Not |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | `postgres://` otomatik `postgresql://`'e çevrilir |
| `JWT_SECRET_KEY` | ✅ (üretimde) | Varsayılan kalırsa `APP_ENV=production`'da uygulama başlamaz |
| `JWT_EXPIRE_MINUTES` | — | 10080 (7 gün) |
| `CLOUDINARY_*` | görsel için | Boşsa upload `503` döner |
| `CORS_ORIGINS` | ✅ | Virgülle ayrılmış; üretimde `*` **kullanılmamalı** |
| `APP_ENV` | — | `production` ek kontrolleri açar |

---

## Security

| Konu | Durum |
| --- | --- |
| Şifre | bcrypt (`passlib`) |
| Token | HS256 JWT, 7 gün |
| Token deposu | `localStorage` — bilinçli ödünleşim, bkz. `missing-services/AUTH.md` |
| Yetkilendirme | Her yazma işleminde sunucu tarafı sahiplik kontrolü |
| Girdi doğrulama | Pydantic + açık uzunluk/aralık kontrolleri |
| Yükleme | MIME beyaz listesi, 5MB, klasör beyaz listesi |
| Gizli anahtar | Yalnızca env; kodda varsayılan yok |
| Açık yönlendirme | `safeRedirect()` site içi yollarla sınırlı |
| XSS | React varsayılan kaçışı; `dangerouslySetInnerHTML` **kullanılmıyor** |
| CSRF | Bearer token kullanıldığı için cookie tabanlı CSRF yüzeyi yok |
| Hata sızıntısı | Ham sunucu/Cloudinary hataları normalize edilir |

**Bilinen boşluklar:** rate limiting yok, e-posta doğrulama yok, hesap kilitleme
yok. Üçü de `docs/missing-services/AUTH.md`'de.

---

## Performance

| Teknik | Uygulama |
| --- | --- |
| Sayfalama | 24/sayfa; "Daha fazla" ile ekleme |
| Arama debounce | 400 ms |
| İstek iptali | `AbortController`, bağımlılık değişiminde |
| Yarış koşulu koruması | Sonuçlar istek kimliğine mühürlenir (`useAsyncData`) |
| Çift gönderim | Bekleyen istek kilidi (favori/beğeni) |
| Görsel | `next/image`, `sizes`, ilk 3 kart `priority` |
| N+1 | Yorum ve sohbet listelerinde gruplu sorgu |
| Render | Context `useMemo`; `stagger-children` yalnızca CSS |

---

## Scalability

Mevcut ölçek için uygun, ancak büyüme sırasında sırasıyla ele alınmalı:

1. **`app/services/` katmanını doldur.** İş mantığı şu an router'larda. İlk
   bölünmesi gereken yer `products.py`.
2. **DB indeksleri:** `products.seller_id`, `products.category`,
   `products.district`, `chats.buyer_id`, `chats.seller_id`,
   `comments.product_id`.
3. **Arama:** `ILIKE '%...%'` indeks kullanamaz. Hacim artınca PostgreSQL
   full-text search (`tsvector` + GIN).
4. **Sohbet:** Şu an istek/yanıt. Gerçek zamanlı için WebSocket
   (`missing-services/MESSAGING.md`).
5. **Kategori/ilçe:** Statik JSON'dan DB'ye taşınmalı.
6. **FK cascade:** Silme temizliği uygulama katmanında. `ON DELETE CASCADE`
   migration'ı daha sağlam olur.

---

## Deployment

| Bileşen | Ortam |
| --- | --- |
| Frontend | Vercel (`.vercel/` mevcut) |
| Backend | Docker (`backend/Dockerfile`), Coolify |
| Veritabanı | PostgreSQL |
| Görseller | Cloudinary |

**Dağıtım öncesi kontrol listesi**

- [ ] `JWT_SECRET_KEY` üretim değeri ayarlandı (yoksa uygulama başlamaz)
- [ ] `CLOUDINARY_*` ayarlandı (**anahtarlar döndürüldü** — bkz. AUDIT.md C4)
- [ ] `CORS_ORIGINS` gerçek alan adına ayarlandı, `*` değil
- [ ] `APP_ENV=production`
- [ ] `alembic upgrade head` çalıştırıldı
- [ ] `NEXT_PUBLIC_API_URL` üretim API'sini gösteriyor
- [ ] `npm run build` başarılı

---

## Komutlar

```bash
# Frontend
npm run dev            # geliştirme (Turbopack)
npm run build          # üretim derlemesi
npm run lint           # ESLint
npx tsc --noEmit       # tip kontrolü

# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload          # :8000
python tests/smoke_test.py             # uçtan uca duman testi
```
