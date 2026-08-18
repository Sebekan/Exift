# Messaging — eksik servisler

## Purpose

Sohbeti kullanılabilir bir iletişim kanalına dönüştürmek: okunmamış takibi,
gerçek zamanlı teslim, sayfalama ve sohbet yönetimi.

## Why UI Needs It

- **Okunmamış sayacı:** Kullanıcı yeni mesaj geldiğini anlayamıyor. Profil
  sekmesinde ve alt gezinmede rozet gösterecek veri yok. Pazar yerinde satıcının
  mesaja hızlı dönmesi doğrudan dönüşümü etkiler.
- **Gerçek zamanlı:** Yeni mesajı görmek için sayfa yenilemek gerekiyor.
- **Sayfalama:** `GET /api/chats/{id}` tüm mesajları tek seferde döndürüyor;
  uzun sohbetlerde yavaşlar.
- **Sohbet silme/arşivleme:** Kullanıcı biten konuşmayı listeden kaldıramıyor.

## Current Backend Status

| Var | Yok |
| --- | --- |
| `POST /api/chats/contact/{product_id}` | Okundu/okunmadı durumu |
| `GET /api/chats/` (liste) | Okunmamış sayacı |
| `GET /api/chats/{id}` (tüm mesajlar) | Mesaj sayfalama |
| `POST /api/chats/{id}/messages` | Gerçek zamanlı (WebSocket/SSE) |
| Katılımcı yetki kontrolü ✅ | Sohbet silme / arşivleme |
| | Yazıyor... göstergesi |
| | Mesajda görsel eki |

## Required Endpoints

```
GET    /api/chats/unread-count           # rozet için toplam
POST   /api/chats/{chat_id}/read         # sohbeti okundu işaretle
GET    /api/chats/{chat_id}/messages     # ?before=<iso>&limit=50 (sayfalı)
DELETE /api/chats/{chat_id}              # katılımcı için gizle
WS     /api/chats/ws                     # gerçek zamanlı akış
```

## Request Models

```python
class MarkReadRequest(BaseModel):
    # Boş gövde de olabilir; belirtilirse bu mesaja kadar okundu sayılır.
    up_to_message_id: uuid.UUID | None = None

class MessagePageQuery(BaseModel):
    before: datetime | None = None    # imleç tabanlı sayfalama
    limit: int = 50                   # 1..100
```

## Response Models

```python
class UnreadCountResponse(BaseModel):
    total: int
    by_chat: dict[uuid.UUID, int]

class MessagePage(BaseModel):
    items: list[ChatMessageOut]
    has_more: bool
    next_cursor: datetime | None

# Mevcut ChatResponse'a eklenecek alanlar:
class ChatResponse(BaseModel):
    ...                       # mevcut alanlar korunur
    unread_count: int         # YENİ
    last_read_at: datetime | None   # YENİ
```

> Mevcut `ChatResponse` alanları **korunmalıdır**; frontend `is_seller`,
> `other_party_*` ve `product_price` alanlarına bağımlı.

## Authentication

Tüm uçlar JWT gerektirir.

## Authorization

Her uçta `current_user.id in (chat.buyer_id, chat.seller_id)` kontrolü.
`_get_authorized_chat()` yardımcı fonksiyonu zaten mevcut, yeniden kullanılmalı.

`DELETE /api/chats/{id}` sohbeti **fiziksel olarak silmemelidir** — yalnızca
talebi yapan taraf için gizlenmeli (karşı tarafın geçmişi korunur).

## Error Handling

| Durum | Kod | `detail` |
| --- | --- | --- |
| Sohbet yok | 404 | `"Sohbet bulunamadı."` |
| Katılımcı değil | 403 | `"Bu sohbete erişiminiz yok."` |
| Boş mesaj | 400 | `"Mesaj boş olamaz."` |
| Çok uzun mesaj | 400 | `"Mesaj en fazla 2000 karakter olabilir."` |
| WS yetkisiz | 4401 (WS close) | — |

## Frontend Integration

Hazır olan taraf:

- `src/components/chat/ChatList.tsx` — rozet için yer var, `unread_count`
  geldiğinde eklenebilir.
- `src/components/layout/MobileBottomNav.tsx` — profil sekmesine nokta rozeti.
- `src/app/sohbet/[chatId]/page.tsx` — iyimser gönderim, gün gruplaması hazır.
- `src/types/index.ts` — `ChatMessage` tipinde `pending`/`failed` alanları var.

Eklenecekler:

```
src/services/chat.service.ts     # getUnreadCount, markRead, getMessages(cursor)
src/hooks/useChatSocket.ts       # WebSocket aboneliği
src/context/AppDataContext.tsx   # unreadCount alanı
```

Sohbet açıldığında `markRead` çağrılmalı; `useEffect` ile `chatId` değişiminde.

## Recommended Backend Implementation

```python
# Seçenek A (önerilen): sohbet başına okundu imleci — basit ve yeterli
class ChatParticipantState(Base):
    __tablename__ = "chat_participant_states"
    __table_args__ = (UniqueConstraint("chat_id", "user_id"),)

    id: Mapped[uuid.UUID]
    chat_id: Mapped[uuid.UUID]        # FK chats.id
    user_id: Mapped[uuid.UUID]        # FK users.id
    last_read_at: Mapped[datetime]
    hidden_at: Mapped[datetime | None]  # "silme" için

# unread_count =
#   SELECT count(*) FROM chat_messages
#   WHERE chat_id = :chat AND sender_id != :me AND created_at > :last_read_at
```

Mesaj başına okundu durumu (seçenek B) daha ayrıntılıdır ama satır sayısını
mesaj × katılımcı kadar büyütür; bu ölçekte gereksizdir.

**Gerçek zamanlı:** Tek instance için FastAPI `WebSocket` + bellek içi bağlantı
havuzu yeterli. Çok instance'a çıkılırsa Redis pub/sub gerekir.

## Security Considerations

1. WebSocket el sıkışmasında JWT doğrulanmalı; bağlantı sonrası her mesajda
   katılımcılık yeniden kontrol edilmeli.
2. Mesaj gönderimine rate limit (spam).
3. `DELETE` gerçek silme yapmamalı — karşı tarafın kaydı korunmalı (uyuşmazlık
   durumunda kanıt).
4. Mesaj içeriği XSS açısından güvenli — React kaçışı var,
   `dangerouslySetInnerHTML` kullanılmıyor. Görsel eki eklenirse yeniden
   değerlendirilmeli.

## Dependencies

- Migration: `chat_participant_states`
- İsteğe bağlı: Redis (çok instance'lı WebSocket)
- Bildirim entegrasyonu: [NOTIFICATIONS.md](./NOTIFICATIONS.md)
