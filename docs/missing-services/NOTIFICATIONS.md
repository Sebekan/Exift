# Notifications — eksik servis

## Purpose

Kullanıcıyı uygulamaya geri getiren olay bildirimleri: yeni mesaj, ilana yorum,
beğeni, favoriye eklenme.

## Why UI Needs It

- `ProfileSettings` içinde "Bildirim tercihleri — yakında" kutusu var. Bu kutu
  bilinçli olarak **pasif** bırakıldı; arkasında servis olmadığı için çalışan
  bir anahtar (toggle) gösterilmedi.
- Kullanıcı ilanına yorum geldiğini ancak siteye girip bakarsa öğreniyor.
- Pazar yerinde satıcının mesaja hızlı dönmesi doğrudan satışı etkiler; bildirim
  bunun en güçlü aracı.

## Current Backend Status

**Hiç yok.** Bildirim tablosu, endpoint'i veya e-posta/push altyapısı bulunmuyor.

Bildirim üretebilecek mevcut olaylar (hepsi zaten backend'de gerçekleşiyor):

| Olay | Tetiklendiği yer |
| --- | --- |
| Yeni mesaj | `POST /api/chats/{id}/messages` |
| Yeni sohbet | `POST /api/chats/contact/{product_id}` |
| İlana yorum | `POST /api/products/{id}/comments` |
| İlan beğenisi | `POST /api/products/{id}/like` |
| Favoriye eklenme | `POST /api/products/{id}/favorite` |

## Required Endpoints

```
GET   /api/notifications                 # ?unread_only=&page=&limit=
GET   /api/notifications/unread-count
POST  /api/notifications/{id}/read
POST  /api/notifications/read-all
GET   /api/notifications/preferences
PUT   /api/notifications/preferences
```

## Request Models

```python
class NotificationPreferences(BaseModel):
    new_message: bool = True
    new_comment: bool = True
    new_like: bool = False        # gürültülü — varsayılan kapalı
    new_favorite: bool = True
    email_enabled: bool = False   # e-posta altyapısı gelene kadar kapalı
```

## Response Models

```python
class NotificationOut(BaseModel):
    id: uuid.UUID
    type: Literal["message", "comment", "like", "favorite"]
    title: str                    # "Yeni mesaj"
    body: str                     # "alice: Merhaba, hâlâ satılık mı?"
    # Tıklanınca gidilecek uygulama içi yol — frontend router.push ile kullanır
    link: str                     # "/sohbet/<uuid>"
    actor_nickname: str | None
    actor_avatar_url: str | None
    product_id: uuid.UUID | None
    is_read: bool
    created_at: datetime

class NotificationPage(BaseModel):
    items: list[NotificationOut]
    total: int
    unread: int
    page: int
    pages: int
```

## Authentication

Tüm uçlar JWT gerektirir.

## Authorization

Kullanıcı yalnızca kendi bildirimlerini okuyabilir/işaretleyebilir:

```python
if notification.user_id != current_user.id:
    raise HTTPException(403, "Bu bildirime erişiminiz yok.")
```

Liste sorgusu **her zaman** `user_id == current_user.id` ile filtrelenmeli.

## Error Handling

| Durum | Kod | `detail` |
| --- | --- | --- |
| Bildirim yok | 404 | `"Bildirim bulunamadı."` |
| Başkasının bildirimi | 403 | `"Bu bildirime erişiminiz yok."` |
| Geçersiz tercih alanı | 422 | Pydantic |

## Frontend Integration

Hazır olan taraf:

- `src/context/ToastContext.tsx` — anlık gösterim için hazır.
- `src/components/layout/Header.tsx` — zil ikonu + rozet için yer var.
- `src/components/layout/MobileBottomNav.tsx` — sekme rozeti.
- `src/components/profile/ProfileSettings.tsx` — "yakında" kutusu gerçek
  anahtarlarla değiştirilecek.
- `src/components/ui/Modal.tsx` — bildirim çekmecesi (drawer) olarak kullanılabilir.

Eklenecekler:

```
src/services/notification.service.ts
src/components/layout/NotificationBell.tsx
src/hooks/useNotifications.ts        # yoklama (polling) veya WS
```

## Recommended Backend Implementation

```python
class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID]
    user_id: Mapped[uuid.UUID]         # FK users.id — alıcı
    actor_id: Mapped[uuid.UUID | None] # FK users.id — eylemi yapan
    type: Mapped[str]                  # message | comment | like | favorite
    product_id: Mapped[uuid.UUID | None]
    chat_id: Mapped[uuid.UUID | None]
    body: Mapped[str]
    is_read: Mapped[bool] = False
    created_at: Mapped[datetime]

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"
    user_id: Mapped[uuid.UUID]         # PK + FK users.id
    new_message: Mapped[bool] = True
    new_comment: Mapped[bool] = True
    new_like: Mapped[bool] = False
    new_favorite: Mapped[bool] = True
    email_enabled: Mapped[bool] = False
```

Bildirim üretimi ilgili router'lara eklenir. Uygulama basit tutulmalı:

```python
def notify(db, user_id, actor, type_, body, **refs):
    # Kendi eylemin için bildirim üretme
    if user_id == actor.id:
        return
    prefs = get_preferences(db, user_id)
    if not getattr(prefs, f"new_{type_}", True):
        return
    db.add(Notification(user_id=user_id, actor_id=actor.id, type=type_, body=body, **refs))
```

**İlk aşamada yoklama (polling) yeterlidir** — 60 sn'de bir `unread-count`.
WebSocket ancak mesajlaşma gerçek zamanlıya geçerken eklenmelidir
(bkz. [MESSAGING.md](./MESSAGING.md)).

## Security Considerations

1. **Kendi eylemine bildirim üretme** — gürültü ve bilgi sızıntısı.
2. **Bildirim gövdesinde hassas veri olmamalı** — mesaj önizlemesi kısaltılmalı.
3. **Bildirim şişmesi:** Aynı ilana art arda beğenide tekrarlı kayıt yerine
   gruplama ("3 kişi beğendi") tercih edilmeli.
4. **Eski kayıtların temizliği:** 90 günden eski okunmuş bildirimler silinmeli.
5. `link` alanı **yalnızca uygulama içi yol** olmalı; dış URL kabul edilirse
   açık yönlendirme riski doğar.

## Dependencies

- Migration: `notifications`, `notification_preferences`
- İndeks: `notifications(user_id, is_read, created_at DESC)`
- E-posta bildirimi için: [AUTH.md](./AUTH.md) ile aynı e-posta sağlayıcısı
