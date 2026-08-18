# Moderation — eksik servisler

## Purpose

Kötüye kullanımı bildirme, kullanıcı engelleme ve içerik denetimi.

## Why UI Needs It

- **Şikayet etme:** Görev tanımında ilan detayı için "Şikayet Et" aksiyonu
  isteniyordu. Backend'de karşılığı olmadığı için **bilinçli olarak
  eklenmedi** — tıklandığında hiçbir şey yapmayan bir buton, hiç olmayan
  butondan kötüdür.
- **Engelleme:** Taciz edici bir kullanıcıdan mesaj almayı durdurmanın yolu yok.
- **İçerik denetimi:** Kullanım Koşulları yasaklı içerik listeliyor
  (çalıntı ürün, nefret söylemi, müstehcen materyal) ama bunu uygulayacak
  hiçbir mekanizma yok.
- **Admin arayüzü:** Kural ihlali tespit edilse bile müdahale yolu yok.

## Current Backend Status

**Hiç yok.** Ne şikayet, ne engelleme, ne admin rolü.

Mevcut tek ilgili alan: `users.is_active` (tanımlı, artık giriş ve token
doğrulamada kontrol ediliyor, ancak onu `False` yapacak bir arayüz yok).

## Required Endpoints

```
POST   /api/reports                      # ilan veya kullanıcı şikayeti
POST   /api/users/{user_id}/block
DELETE /api/users/{user_id}/block
GET    /api/users/blocked                # engellediklerim

# Admin (rol gerektirir)
GET    /api/admin/reports                # ?status=pending
POST   /api/admin/reports/{id}/resolve
POST   /api/admin/users/{id}/suspend
DELETE /api/admin/products/{id}          # kural ihlali kaldırma
```

## Request Models

```python
class ReportReason(str, Enum):
    spam = "spam"
    counterfeit = "counterfeit"          # sahte/çalıntı ürün
    inappropriate = "inappropriate"      # müstehcen/şiddet
    hate_speech = "hate_speech"
    scam = "scam"
    other = "other"

class CreateReportRequest(BaseModel):
    target_type: Literal["product", "user", "comment"]
    target_id: uuid.UUID
    reason: ReportReason
    description: str = ""                # max 1000

class ResolveReportRequest(BaseModel):
    action: Literal["dismiss", "remove_content", "suspend_user"]
    admin_note: str = ""
```

## Response Models

```python
class ReportOut(BaseModel):
    id: uuid.UUID
    target_type: str
    target_id: uuid.UUID
    reason: str
    status: Literal["pending", "reviewing", "resolved", "dismissed"]
    created_at: datetime
    # reporter_id ADMIN DIŞINDA gösterilmemeli

class BlockedUserOut(BaseModel):
    id: uuid.UUID
    nickname: str
    avatar_url: str | None
    blocked_at: datetime
```

## Authentication

| Endpoint | Auth |
| --- | --- |
| `POST /api/reports` | ✅ JWT (anonim şikayet kabul edilmemeli — spam) |
| Engelleme uçları | ✅ JWT |
| `/api/admin/*` | ✅ JWT + **admin rolü** |

## Authorization

Admin rolü **şu an mevcut değil.** `users` tablosuna eklenmelidir:

```python
is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
```

ve yeni bir bağımlılık:

```python
def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(403, "Bu işlem için yetkiniz yok.")
    return current_user
```

Kullanıcı kendini şikayet edemez veya engelleyemez.

## Error Handling

| Durum | Kod | `detail` |
| --- | --- | --- |
| Hedef yok | 404 | `"Şikayet edilen içerik bulunamadı."` |
| Kendini şikayet/engelleme | 400 | `"Kendini şikayet edemezsin."` |
| Zaten şikayet edilmiş | 409 | `"Bu içeriği zaten şikayet ettin."` |
| Admin değil | 403 | `"Bu işlem için yetkiniz yok."` |
| Çok fazla şikayet | 429 | `"Çok fazla şikayet gönderdin. Lütfen bekle."` |

## Frontend Integration

Hazır olan taraf:

- `src/lib/ownership.ts` — `getProductActions` içine `canReport` eklenir
  (sahip kendi ilanını şikayet edemez).
- `src/components/ui/Modal.tsx` — şikayet formu için hazır.
- `src/app/ilan/[id]/page.tsx` — ziyaretçi aksiyon çubuğunda yer var.

Eklenecekler:

```
src/components/moderation/ReportDialog.tsx
src/services/moderation.service.ts
src/app/admin/**                          # ayrı, korumalı alan
```

**Engelleme etkisi:** Engellenen kullanıcının ilanları listede gizlenmeli ve
sohbet açması engellenmeli. Bu, `GET /api/products/` ve
`POST /api/chats/contact/{id}` uçlarında filtre gerektirir.

## Recommended Backend Implementation

```python
class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (
        UniqueConstraint("reporter_id", "target_type", "target_id",
                         name="uq_one_report_per_user_per_target"),
    )

    id: Mapped[uuid.UUID]
    reporter_id: Mapped[uuid.UUID]       # FK users.id
    target_type: Mapped[str]             # product | user | comment
    target_id: Mapped[uuid.UUID]
    reason: Mapped[str]
    description: Mapped[str]
    status: Mapped[str] = "pending"
    resolved_by: Mapped[uuid.UUID | None]
    admin_note: Mapped[str]
    created_at: Mapped[datetime]

class UserBlock(Base):
    __tablename__ = "user_blocks"
    __table_args__ = (UniqueConstraint("blocker_id", "blocked_id"),)

    id: Mapped[uuid.UUID]
    blocker_id: Mapped[uuid.UUID]
    blocked_id: Mapped[uuid.UUID]
    created_at: Mapped[datetime]
```

**Aşamalandırma önerisi:** Önce yalnızca `POST /api/reports` + e-posta
bildirimi uygulanabilir. Tam admin paneli olmadan da şikayetler bir yere
düşer ve manuel işlenir. Bu, en düşük maliyetle en büyük riski kapatır.

## Security Considerations

1. **Şikayetçi kimliği gizli kalmalı** — hedef kullanıcıya asla gösterilmemeli;
   misilleme riski.
2. **Şikayet spam'i:** Kullanıcı-hedef çifti başına tek şikayet
   (`UniqueConstraint`) + rate limiting.
3. **Admin uçları ayrı korunmalı;** `is_admin` alanı **asla** `PUT /api/auth/me`
   üzerinden değiştirilebilir olmamalı. Mevcut `UserUpdate` şeması yalnızca
   `nickname`, `bio`, `avatar_url`, `phone` kabul ediyor — bu koruma korunmalı.
4. **Engelleme çift yönlü uygulanmalı:** A, B'yi engellerse B de A ile iletişim
   kuramamalı; aksi hâlde engelleme taciz karşısında işlevsiz kalır.
5. **KVKK:** Şikayet kayıtları kişisel veri içerir; saklama süresi tanımlanmalı.

## Dependencies

- Migration: `reports`, `user_blocks`, `users.is_admin`
- E-posta bildirimi: [AUTH.md](./AUTH.md) ile aynı sağlayıcı
- Admin paneli (ayrı frontend alanı veya harici araç)
