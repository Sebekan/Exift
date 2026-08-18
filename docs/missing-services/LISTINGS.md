# Listings — eksik servisler

## Purpose

İlan yönetimini tamamlamak: görüntülenme istatistiği, taslak/pasif durumu ve
satıcının ilanını yayından geçici olarak kaldırabilmesi.

## Why UI Needs It

- **Görüntülenme sayacı:** Görev tanımındaki ilan kartı alanları arasında
  "Views if available" geçiyor. Backend'de böyle bir alan **yok**, bu yüzden
  kartlarda gösterilmedi (uydurulmadı). Satıcı ilanının ilgi görüp görmediğini
  ölçemiyor — fiyat/başlık iyileştirmesi için temel sinyal.
- ~~**Taslak / pasif ilan:**~~ ✅ Uygulandı — `products.is_published` (bool)
  ile satıcı ilanını `POST /{id}/unpublish` / `POST /{id}/republish` ile
  geçici olarak yayından kaldırabiliyor/tekrar yayınlayabiliyor. Aşağıdaki
  `draft`/`paused` içeren `status` enum önerisi **uygulanmadı** — daha basit
  bir booleanla çözüldü. Taslak (yayınlamadan önce kaydetme) hâlâ yok.
- **Kategori/ilçe yönetimi:** Kategoriler ve ilçeler `src/data/*.json` içinde
  statik. Yeni kategori eklemek yeniden dağıtım gerektiriyor.

## Current Backend Status

| Var | Yok |
| --- | --- |
| CRUD (`GET/POST/PUT/DELETE /api/products`) | `views_count` |
| `POST /{id}/sell` (satıldı) | Taslak (yayınlamadan kaydetme) |
| `POST /{id}/unpublish`, `/{id}/republish` ✅ | Satıldı işlemini geri alma |
| `GET /mine` (kendi ilanları) | İlan yenileme/öne çıkarma |
| `GET /museum` (satılmışlar, onaylılar) | Fiyat aralığı filtresi ✅ (eklendi) |
| Filtre: `category`, `district`, `q`, fiyat aralığı ✅ | |
| Sıralama (`sort`) ✅ | |
| Sayfalama | Kategori/ilçe API'si |
| Sahiplik kontrolü ✅ | |

## Required Endpoints

```
POST  /api/products/{id}/view          # görüntülenme kaydı (idempotent-ish)
GET   /api/products/{id}/stats         # satıcıya özel: views, favoriler, sohbetler
PATCH /api/products/{id}/status        # draft | active | paused
GET   /api/categories                  # DB'den kategoriler
GET   /api/districts                   # DB'den ilçeler
```

Ayrıca `GET /api/products/` için ek sorgu parametreleri:
`min_price`, `max_price`, `sort` (`newest` | `price_asc` | `price_desc` | `popular`).

## Request Models

```python
class UpdateStatusRequest(BaseModel):
    status: Literal["draft", "active", "paused"]
```

## Response Models

```python
class ProductStats(BaseModel):
    views_count: int
    unique_viewers: int
    favorites_count: int
    chats_count: int
    likes_count: int          # zaten hesaplanıyor

# ProductOut'a eklenecek (mevcut alanlar korunarak):
class ProductOut(BaseModel):
    ...
    views_count: int = 0      # YENİ — herkese açık
    status: str = "active"    # YENİ
```

> ⚠️ Mevcut `ProductOut` alanları korunmalı. Frontend `seller.id` (sahiplik),
> `is_liked`, `is_favorited`, `comments_count` alanlarına bağımlı.

## Authentication

| Endpoint | Auth |
| --- | --- |
| `POST /{id}/view` | Opsiyonel (anonim görüntülenme de sayılmalı) |
| `GET /{id}/stats` | ✅ + sahiplik |
| `PATCH /{id}/status` | ✅ + sahiplik |
| `GET /api/categories`, `/api/districts` | Yok |

## Authorization

`stats` ve `status` yalnızca `product.seller_id == current_user.id` için.
Mevcut kontrol deseni aynen kullanılmalı:

```python
if product.seller_id != current_user.id:
    raise HTTPException(403, "Bu işlem için yetkiniz yok.")
```

`draft` ve `paused` ilanlar `GET /api/products/` listesinde **görünmemeli**,
ancak sahibi `GET /api/products/mine` ile görebilmeli.

## Error Handling

| Durum | Kod | `detail` |
| --- | --- | --- |
| İlan yok | 404 | `"İlan bulunamadı."` |
| Sahip değil | 403 | `"Bu işlem için yetkiniz yok."` |
| Satılmış ilanın durumu değiştirilemez | 400 | `"Satılmış ilanlar düzenlenemez."` |
| Geçersiz durum | 422 | Pydantic `Literal` doğrulaması |

## Frontend Integration

Hazır olan taraf:

- `src/components/product/ProductCard.tsx` — sayaç satırında yer var
  (`commentsCount`/`likes` yanına `views` eklenebilir).
- `src/app/profil/page.tsx` — istatistik kutuları hazır; "Toplam görüntülenme"
  dördüncü kutu olarak eklenebilir.
- `src/components/ui/Tabs.tsx` — "Pasif" sekmesi eklemek tek satır.
- `src/lib/ownership.ts` — `getProductActions` içine `canPause` eklenir.

Eklenecekler:

```
src/services/listing.service.ts   # recordView, getStats, updateStatus
src/types/index.ts                # Product.viewsCount, Product.status
```

Görüntülenme kaydı ilan detayında `useEffect` ile, ilan başına oturumda bir kez
çağrılmalı (`sessionStorage` ile tekrar engellenir).

## Recommended Backend Implementation

```python
# Görüntülenme — şişmeyi önlemek için ham kayıt yerine gün+ziyaretçi tekilleştirmesi
class ProductView(Base):
    __tablename__ = "product_views"
    __table_args__ = (UniqueConstraint("product_id", "viewer_key", "viewed_on"),)

    id: Mapped[uuid.UUID]
    product_id: Mapped[uuid.UUID]           # FK products.id
    viewer_key: Mapped[str]                 # user_id veya IP+UA hash'i
    viewed_on: Mapped[date]                 # gün bazlı tekilleştirme

# products tablosuna denormalize sayaç (okuma hızlı olsun):
# products.views_count: Mapped[int] = mapped_column(Integer, default=0)

# products.status
# status: Mapped[str] = mapped_column(String(20), default="active")
# → mevcut kayıtlar migration'da "active" olarak doldurulur
```

`sold` alanı **korunmalı**; `status` ile çakışmaz (`sold=True` ilan Müze'ye
gider, `status` ondan bağımsızdır). Alternatif olarak `sold` da `status`
enum'una taşınabilir ama bu Müze sorgusunu ve mevcut frontend'i değiştirir —
kazancı riskini karşılamıyor.

## Security Considerations

1. **Görüntülenme şişirme:** Anonim ziyaretçi IP+User-Agent hash'i ile
   tekilleştirilmeli; ham IP saklanmamalı (KVKK).
2. **Sahibin kendi görüntülemesi sayılmamalı.**
3. **`stats` sızıntısı:** Yalnızca sahibe; başkasının ilan performansı gizli.
4. **`draft`/`paused` sızıntısı:** Liste sorgularında filtre unutulursa
   yayınlanmamış ilan görünür. Sorgu varsayılanı `status == "active"` olmalı.

## Dependencies

- Migration: `product_views`, `products.views_count`, `products.status`
- İsteğe bağlı: `categories` ve `districts` tabloları
- İndeks: `products(status, created_at)`, `product_views(product_id)`
