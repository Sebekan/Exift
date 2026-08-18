# Profile — eksik servisler

## Purpose

Kullanıcı profilini bir güven sinyaline dönüştürmek: herkese açık satıcı
profili, itibar göstergeleri ve KVKK uyumlu hesap silme.

## Why UI Needs It

- **Herkese açık profil:** İlan detayında satıcı adı ve biyografisi gösteriliyor
  ama tıklanabilir değil. Alıcı "bu satıcının başka ne ilanı var?" veya "kaç
  satış yapmış?" sorularını yanıtlayamıyor. Pazar yerinde güven en kritik
  dönüşüm faktörü.
- **Hesap silme:** `ProfileSettings` şu an kullanıcıyı e-posta göndermeye
  yönlendiriyor. Bu KVKK'nın "silme hakkı" maddesi için zayıf bir çözüm ve
  gizlilik politikamızda 30 gün içinde silme taahhüdü var.
- **Satıcı istatistikleri:** "Kaç ilan sattı", "ne zaman katıldı" gibi veriler
  kısmen var ama herkese açık uçtan sunulmuyor.

## Current Backend Status

| Var | Yok |
| --- | --- |
| `GET /api/auth/me` (kendi profili) | `GET /api/users/{id}` (herkese açık) |
| `PUT /api/auth/me` (nickname, bio, avatar, phone) | Kullanıcının herkese açık ilanları |
| `POST /api/auth/change-password` | Hesap silme |
| `users.is_active` alanı (kullanılmıyor) | Satıcı itibar/istatistikleri |
| | Kullanıcı doğrulama rozeti |

> Not: `ProductOut.seller` zaten `id`, `nickname`, `bio`, `avatar_url` taşıyor —
> yani herkese açık profil için gereken veri modeli **kısmen mevcut**.

## Required Endpoints

```
GET    /api/users/{user_id}                 # herkese açık profil
GET    /api/users/{user_id}/products        # kullanıcının aktif ilanları (sayfalı)
DELETE /api/auth/me                         # hesap silme (şifre teyitli)
```

## Request Models

```python
class DeleteAccountRequest(BaseModel):
    password: str          # hassas işlem — şifre teyidi zorunlu
    confirmation: str      # kullanıcı "HESABIMI SIL" yazmalı (kaza koruması)
```

## Response Models

```python
class PublicUserOut(BaseModel):
    id: uuid.UUID
    nickname: str
    bio: str
    avatar_url: str | None
    joined_at: datetime
    # İtibar sinyalleri — hepsi türetilmiş, yeni sütun gerekmez:
    active_listings_count: int
    sold_listings_count: int

    # ⚠️ email ve phone ASLA bu modelde bulunmamalı
```

## Authentication

| Endpoint | Auth |
| --- | --- |
| `GET /api/users/{id}` | Yok (herkese açık) |
| `GET /api/users/{id}/products` | Yok |
| `DELETE /api/auth/me` | ✅ JWT + şifre teyidi |

## Authorization

- Herkese açık profil **hiçbir koşulda** e-posta veya telefon döndürmemeli.
- `is_active=False` kullanıcıların profili 404 dönmeli.
- Hesap silme yalnızca hesap sahibi tarafından; admin yolu ayrı ele alınmalı.

## Error Handling

| Durum | Kod | `detail` |
| --- | --- | --- |
| Kullanıcı yok / pasif | 404 | `"Kullanıcı bulunamadı."` |
| Şifre hatalı | 400 | `"Şifre hatalı."` |
| Onay metni yanlış | 400 | `"Onaylamak için 'HESABIMI SIL' yazmalısın."` |

## Frontend Integration

Hazır olan taraf:

- `src/components/ui/Avatar.tsx` — profil görseli bileşeni hazır.
- `src/components/product/ProductGrid.tsx` — kullanıcının ilanları için hazır.
- `src/app/ilan/[id]/page.tsx` — satıcı kartı var, `<Link>`e çevrilecek.
- `src/components/ui/Modal.tsx` — `ConfirmDialog` hesap silme onayı için hazır.

Eklenecekler:

```
src/app/kullanici/[id]/page.tsx
src/services/user.service.ts        # getPublicProfile, getUserProducts, deleteAccount
```

`ProductDetailPage` içindeki satıcı kartı `<Link href={`/kullanici/${product.seller.id}`}>`
ile sarılır — `seller.id` zaten mevcut.

## Recommended Backend Implementation

Yeni tablo **gerekmez**; mevcut veriden türetilir:

```python
@router.get("/api/users/{user_id}", response_model=PublicUserOut)
def get_public_profile(user_id: uuid.UUID, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(404, "Kullanıcı bulunamadı.")

    active = db.query(func.count(Product.id)).filter(
        Product.seller_id == user.id, Product.sold == False).scalar()
    sold = db.query(func.count(Product.id)).filter(
        Product.seller_id == user.id, Product.sold == True).scalar()

    return PublicUserOut(
        id=user.id, nickname=user.nickname, bio=user.bio,
        avatar_url=user.avatar_url, joined_at=user.joined_at,
        active_listings_count=active, sold_listings_count=sold,
    )
```

**Hesap silme — anonimleştirme yaklaşımı (önerilen):**

Sert silme, satılmış ilanların Müze'deki hikâyelerini ve karşı tarafın sohbet
geçmişini yok eder. Gizlilik politikamız "müzedeki satılmış ilanlar anonim
olarak korunabilir" diyor. Bu nedenle:

```python
# 1. Aktif (satılmamış) ilanları sil — bağımlı kayıt temizliğiyle birlikte
#    (delete_product'taki mantık yeniden kullanılmalı)
# 2. Satılmış ilanlar korunur; seller anonim bir "silinmiş kullanıcı" hesabına taşınır
# 3. Sohbetler korunur, karşı taraf "Silinmiş kullanıcı" görür
#    (chats.py zaten bu duruma hazır: other_party None ise "Silinmiş kullanıcı")
# 4. Kullanıcı kaydı: is_active=False, email/phone/avatar anonimleştirilir
user.is_active = False
user.email = f"deleted-{user.id}@exift.invalid"
user.phone = None
user.nickname = f"silinmis-{str(user.id)[:8]}"
user.bio = ""
user.avatar_url = None
```

> `chats.py` içindeki `other_party.nickname if other_party else "Silinmiş kullanıcı"`
> ifadesi bu senaryo için zaten hazır.

## Security Considerations

1. **PII sızıntısı:** `PublicUserOut` modeli `UserOut`'tan **ayrı** olmalı;
   `UserOut` yeniden kullanılırsa e-posta ve telefon herkese açılır. Bu en
   olası hatadır.
2. **Kullanıcı sayımı:** `GET /api/users/{id}` UUID aldığı için tahmin edilemez;
   nickname ile erişim eklenirse sayım riski doğar.
3. **Hesap silme geri alınamaz** — çift onay (şifre + yazılı teyit) zorunlu.
4. **Silme sonrası oturum:** Kullanıcının tüm token'ları geçersiz kılınmalı;
   `is_active=False` kontrolü `dependencies.py` içinde **zaten mevcut**, bu
   yüzden silinen hesabın token'ı otomatik olarak 403 alır.
5. **Cloudinary temizliği:** Silinen hesabın görselleri kaldırılmalı —
   bkz. [UPLOAD.md](./UPLOAD.md).

## Dependencies

- Yeni tablo yok
- İndeks: `products(seller_id, sold)`
- Cloudinary silme: [UPLOAD.md](./UPLOAD.md)
