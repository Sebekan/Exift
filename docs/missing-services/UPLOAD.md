# Upload — eksik servisler

## Purpose

Yüklenen görsellerin yaşam döngüsünü tamamlamak: silme, kota ve yetim dosya
temizliği.

## Why UI Needs It

- **Görsel silme:** `ImageUploader` bir görseli listeden çıkarabiliyor, ancak bu
  yalnızca ilan kaydındaki referansı kaldırıyor. Dosya Cloudinary'de kalıyor.
  Zamanla depolama maliyeti ve yetim dosya birikimi oluşuyor.
- **İlan/hesap silindiğinde:** İlişkili görseller Cloudinary'de kalıyor.
- **Kota:** Kullanıcı başına yükleme sınırı yok; kötüye kullanım depolama
  maliyetini sınırsız artırabilir.

## Current Backend Status

| Var | Yok |
| --- | --- |
| `POST /api/upload/image` (JWT) | Görsel silme |
| MIME beyaz listesi ✅ | `public_id` ↔ ilan ilişkisi kaydı |
| 5MB sınırı ✅ | Kullanıcı başına kota |
| Klasör beyaz listesi (`products`/`avatars`) ✅ | Yetim dosya temizliği |
| Cloudinary dönüşümleri ✅ | Toplu yükleme |

> `POST /api/upload/image` yanıtında `public_id` **dönüyor** ama hiçbir yerde
> saklanmıyor — silme için gereken anahtar bu.

## Required Endpoints

```
DELETE /api/upload/image/{public_id}     # tek görsel sil
GET    /api/upload/quota                 # kullanıcının kalan kotası
```

## Request Models

`public_id` yol parametresinde. Cloudinary `public_id`'leri `/` içerdiği için
(`exift/products/abc123`) endpoint bunu URL-encoded almalı veya
`path:path` parametresi kullanmalı:

```python
@router.delete("/image/{public_id:path}")
```

## Response Models

```python
class DeleteImageResponse(BaseModel):
    deleted: bool
    public_id: str

class QuotaResponse(BaseModel):
    used_bytes: int
    limit_bytes: int          # örn. kullanıcı başına 100 MB
    image_count: int
    image_limit: int          # örn. 200
```

## Authentication

Her iki uç da JWT gerektirir.

## Authorization

**En kritik nokta.** Şu an `public_id` ile bir kullanıcı arasında hiçbir kayıtlı
ilişki yok. Silme endpoint'i bu ilişki kurulmadan eklenirse **herhangi bir
kullanıcı başkasının görselini silebilir.**

Bu yüzden silme, kayıt tablosuyla **birlikte** eklenmelidir:

```python
if asset.owner_id != current_user.id:
    raise HTTPException(403, "Bu görseli silme yetkiniz yok.")
```

## Error Handling

| Durum | Kod | `detail` |
| --- | --- | --- |
| Görsel yok | 404 | `"Görsel bulunamadı."` |
| Sahip değil | 403 | `"Bu görseli silme yetkiniz yok."` |
| Kota aşımı | 400 | `"Yükleme kotanı doldurdun. Eski görselleri silebilirsin."` |
| Cloudinary hatası | 502 | `"Görsel silinemedi. Lütfen tekrar dene."` |
| Cloudinary yapılandırılmamış | 503 | `"Görsel servisi şu anda kullanılamıyor."` |

> `503` ve `502` davranışı yükleme tarafında **zaten uygulanmış durumda**.

## Frontend Integration

Hazır olan taraf:

- `src/components/product/ImageUploader.tsx` — silme butonu var; şu an yalnızca
  yerel listeden çıkarıyor. `public_id` saklanırsa gerçek silme çağrısı eklenir.
- `src/services/upload.service.ts` — servis katmanı hazır.

Değişecekler:

```ts
// Şu an yalnızca URL tutuluyor:
images: string[]

// Silme için public_id de gerekir:
images: { url: string; publicId: string }[]
```

Bu, `ListingForm` ve `listing.service` içinde küçük bir tip değişikliği
gerektirir. Backend `ProductOut.images` şeklini değiştireceği için
**geriye dönük uyumluluk** planlanmalı (yeni alan `image_assets` olarak
eklenip `images` korunabilir).

## Recommended Backend Implementation

```python
class UploadedAsset(Base):
    __tablename__ = "uploaded_assets"

    id: Mapped[uuid.UUID]
    owner_id: Mapped[uuid.UUID]              # FK users.id
    public_id: Mapped[str]                   # unique, Cloudinary anahtarı
    url: Mapped[str]
    bytes: Mapped[int]
    folder: Mapped[str]                      # products | avatars
    # Hangi ilana bağlı — NULL ise henüz bir ilana iliştirilmemiş (yetim adayı)
    product_id: Mapped[uuid.UUID | None]
    created_at: Mapped[datetime]
```

Silme:

```python
import cloudinary.uploader
cloudinary.uploader.destroy(public_id)
```

**Yetim temizliği:** Kullanıcı görsel yükleyip ilanı yayınlamadan çıkabilir.
Günlük bir görev, `product_id IS NULL AND created_at < now() - interval '24 hours'`
koşulunu sağlayan kayıtları Cloudinary'den ve tablodan siler.

**İlan/hesap silindiğinde:** `delete_product` ve hesap silme akışına ilgili
`UploadedAsset` kayıtlarının Cloudinary'den kaldırılması eklenmeli.

## Security Considerations

1. **Sahiplik zorunlu.** `public_id` tahmin edilebilir olmasa da, sahiplik
   kaydı olmadan silme endpoint'i açılırsa yetkisiz silme mümkün olur. Bu
   servisin tek başına eklenmemesi gereken parçası budur.
2. **Kota olmadan sınırsız yükleme** — depolama maliyeti saldırı yüzeyidir.
3. **MIME doğrulaması yeterli değil.** İçerik tipi başlığı sahte olabilir;
   Cloudinary `resource_type="image"` ile ikinci savunma hattını sağlıyor
   (zaten uygulanmış).
4. **EXIF verisi:** Fotoğraflar GPS konumu taşıyabilir. Cloudinary dönüşümü
   metadata'yı varsayılan olarak temizler, ancak bu açıkça doğrulanmalı —
   pazar yerinde ev adresi sızıntısı ciddi bir risktir.
5. **`public_id` yol geçişi (path traversal):** `{public_id:path}` kullanılırsa
   girdi `exift/` ön ekiyle sınırlanmalı, aksi hâlde başka klasörlerdeki
   varlıklar hedeflenebilir.

## Dependencies

- Migration: `uploaded_assets`
- Zamanlanmış görev altyapısı (cron / APScheduler / Celery beat)
- Cloudinary Admin API (silme için `api_secret` gerekir — zaten mevcut)
