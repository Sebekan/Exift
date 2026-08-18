# Müze onayı — eksik servisler

## Purpose

Satılan bir ilanın Exift Müzesi'nde sergilenip sergilenmeyeceğine karar veren
bir onay adımı. Satıcı sergilenmesini istemeyebilir; bu yüzden "satıldı ⇒
otomatik müzeye düşer" davranışı kaldırıldı, ama onu kimin/nasıl
onaylayacağı henüz kararlaştırılmadı.

## Why UI Needs It

- Satış tamamlama akışında satıcıya artık "🏛️ Müzeye Gönder / Daha Sonra"
  seçimi soruluyor (`src/app/ilan/[id]/page.tsx`). "Müzeye Gönder" seçilince
  ilan `museum_status = "pending"` olur.
- `GET /api/products/museum` yalnızca `museum_status == "approved"` olan
  ilanları listeler — yani **hiçbir onay mekanizması olmadan `pending`
  durumundaki hiçbir ilan Müze'de görünmez.**
- Bu bilinçli bir tercih: yarım bir "otomatik onay" veya sahte bir admin
  paneli eklemek yerine, karar kullanıcıya bırakıldı.

## Current Backend Status

| Var | Yok |
| --- | --- |
| `products.museum_status` (`none`/`pending`/`approved`/`rejected`) ✅ | Onay/red uçları |
| `POST /{id}/museum-submit` (satıcı, sold olmalı) ✅ | Admin rolü (`users.is_admin`) |
| `GET /museum` yalnızca `approved` filtreler ✅ | Bildirim ("başvurun onaylandı") |

Şu an `pending` durumundaki bir ilanı `approved`'e taşımanın **tek yolu**
veritabanına doğrudan `UPDATE` atmak:

```sql
UPDATE products SET museum_status = 'approved' WHERE id = '...';
```

## Karar bekleyen soru

Onayı kim/nasıl verecek? Seçenekler konuşuldu ama karara bağlanmadı:

1. **Basit admin paneli** — `users.is_admin` eklenir (bkz.
   [MODERATION.md](./MODERATION.md)'deki `require_admin` deseni), korumalı bir
   `/admin` sayfasında bekleyen başvurular listelenir, onayla/reddet butonları
   olur. İlk admin hesabı DB'de elle işaretlenir.
2. **Veritabanından manuel onay** — panel yok, yukarıdaki `UPDATE` sorgusuyla
   idare edilir. Hacim düşükken makul, ölçeklenmez.
3. Başka bir akış (ör. e-posta ile onay talebi) — henüz gündeme gelmedi.

## Required Endpoints (1. seçenek uygulanırsa)

```
GET  /api/admin/museum-submissions          # ?status=pending
POST /api/admin/museum-submissions/{id}/approve
POST /api/admin/museum-submissions/{id}/reject
```

## Request/Response Models (taslak)

```python
class MuseumDecisionRequest(BaseModel):
    admin_note: str = ""

# ProductOut zaten museum_status döndürüyor — admin listesi için ek şema gerekmez.
```

## Authentication & Authorization

| Endpoint | Auth |
| --- | --- |
| `/api/admin/museum-submissions*` | ✅ JWT + `is_admin` |

`MODERATION.md`'deki `require_admin` bağımlılığı bu uçlar için de kullanılabilir
— iki servis aynı admin rolünü paylaşmalı, ayrı bir rol sistemi kurulmamalı.

## Frontend Integration

Hazır olan taraf:

- `src/services/listing.service.ts` — `submitToMuseum` zaten var.
- `src/app/ilan/[id]/page.tsx` — satıcı tarafı akış tamamlandı, ek iş yok.

Eklenecekler (1. seçenek uygulanırsa):

```
src/app/admin/muze/page.tsx           # bekleyen başvurular + onay/red
src/services/admin.service.ts
```

## Dependencies

- `users.is_admin` migration (MODERATION.md ile ortak)
- Karar: admin paneli mi, manuel DB mi (yukarıya bkz.)
