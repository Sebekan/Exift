# Auth — eksik servisler

## Purpose

Kimlik doğrulama akışını tamamlamak: şifre sıfırlama, e-posta değiştirme/doğrulama,
oturum yenileme ve kaba kuvvet koruması.

## Why UI Needs It

- **Şifre sıfırlama:** Şifresini unutan kullanıcının hesabına dönüş yolu yok.
  Giriş ekranında "Şifremi unuttum" bağlantısı **bilinçli olarak eklenmedi**,
  çünkü arkasında çalışan bir servis yok.
- **E-posta değiştirme:** `ProfileSettings` e-postayı salt-okunur gösteriyor ve
  "şu an değiştirilemiyor" diyor. Bu dürüst ama eksik bir deneyim.
- **Refresh token:** JWT 7 gün geçerli; süre dolduğunda kullanıcı hiçbir uyarı
  almadan aniden çıkış yapmış oluyor.
- **Rate limiting:** Giriş uçları sınırsız denemeye açık.

## Current Backend Status

| Var | Yok |
| --- | --- |
| `POST /api/auth/register` | Şifre sıfırlama (istek + onay) |
| `POST /api/auth/login` | E-posta **değiştirme** + doğrulama |
| `GET/PUT /api/auth/me` | Refresh token / oturum yenileme |
| `POST /api/auth/change-password` | Rate limiting |
| `POST /api/auth/verify-email` ✅ | **Gerçek e-posta gönderim sağlayıcısı** (aşağıya bkz.) |
| `POST /api/auth/resend-verification` ✅ | Hesap kilitleme |
| `users.is_verified` / `verification_token` ✅ | Çıkışta token iptali (JWT stateless) |

### E-posta doğrulama: altyapı hazır, gönderim bekliyor

Kayıt sırasında token üretiliyor, `verify-email`/`resend-verification` uçları
çalışıyor, `UserOut.is_verified` frontend'e dönüyor. Ama `app/utils/email.py`
içindeki `send_verification_email()` gerçekten e-posta **göndermiyor** —
bağlantıyı sadece loglar. Karar bekleyen iki şey var:

1. **Sağlayıcı seçimi:** Gmail SMTP (uygulama şifresi) mi, yoksa Resend /
   SendGrid gibi transactional bir API mi kullanılacak? İkisi de `.env`'e
   kimlik bilgisi eklenmesini gerektiriyor.
2. **Zorunluluk kararı:** Doğrulanmamış kullanıcı giriş yapabilsin mi/ilan
   verebilsin mi, yoksa doğrulama zorunlu mu olacak? Şu an **bloklamıyor** —
   gönderim çalışmadan zorunlu kılmak tüm kullanıcıları kilitler.

Sağlayıcı seçilince yalnızca `send_verification_email()` gövdesi değişecek;
çağıran kod (`routers/auth.py`) aynı kalır.

## Required Endpoints

### 1. Şifre sıfırlama

```
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### 2. E-posta değiştirme

```
POST /api/auth/change-email          # doğrulama e-postası gönderir
POST /api/auth/verify-email          # token ile onaylar
```

### 3. Oturum yenileme

```
POST /api/auth/refresh
```

## Request Models

```python
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str        # min 6, register ile aynı kural

class ChangeEmailRequest(BaseModel):
    new_email: EmailStr
    current_password: str    # hassas işlem — şifre teyidi şart

class VerifyEmailRequest(BaseModel):
    token: str

class RefreshRequest(BaseModel):
    refresh_token: str
```

## Response Models

```python
# Kullanıcı sayımı (enumeration) sızdırmamak için HER ZAMAN aynı yanıt:
class GenericMessage(BaseModel):
    detail: str   # "Eğer bu e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi."

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
```

## Authentication

| Endpoint | Auth |
| --- | --- |
| `forgot-password` | Yok (herkese açık) |
| `reset-password` | Yok — tek kullanımlık token ile |
| `change-email` | ✅ JWT + mevcut şifre |
| `verify-email` | Yok — token ile |
| `refresh` | Refresh token |

## Authorization

Kullanıcı yalnızca **kendi** hesabı üzerinde işlem yapabilir. `reset-password`
token'ı tek kullanımlıktır, kullanıldıktan sonra geçersiz kılınmalıdır.

## Error Handling

| Durum | Kod | `detail` |
| --- | --- | --- |
| Geçersiz/süresi dolmuş token | 400 | `"Bağlantının süresi dolmuş. Lütfen yeniden talep et."` |
| Şifre çok kısa | 400 | `"Şifre en az 6 karakter olmalı."` |
| E-posta zaten kayıtlı | 400 | `"Bu e-posta adresi zaten kayıtlı."` |
| Mevcut şifre hatalı | 400 | `"Mevcut şifre hatalı."` |
| Çok fazla deneme | 429 | `"Çok fazla deneme yaptın. Lütfen 15 dakika bekle."` |

> `429` istemcide zaten destekleniyor: `kindFromStatus` → `rate_limited` →
> kullanıcı dostu mesaj.

## Frontend Integration

Hazır olan taraf:

- `src/lib/api/errors.ts` — `rate_limited` dâhil tüm hata türleri tanımlı.
- `src/lib/validation.ts` — `validatePassword`, `passwordStrength` mevcut.
- `src/components/ui/Field.tsx` — form bileşenleri hazır.

Eklenecekler:

```
src/app/auth/sifremi-unuttum/page.tsx
src/app/auth/sifre-sifirla/page.tsx      # ?token=...
src/services/auth.service.ts             # forgotPassword, resetPassword, changeEmail
```

`AuthForm`'a "Şifremi unuttum" bağlantısı **yalnızca servis geldiğinde**
eklenmelidir.

## Recommended Backend Implementation

```python
# Yeni tablo
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id: Mapped[uuid.UUID]
    user_id: Mapped[uuid.UUID]      # FK users.id
    token_hash: Mapped[str]         # ⚠️ ham token DEĞİL, hash saklanır
    expires_at: Mapped[datetime]    # +1 saat
    used_at: Mapped[datetime | None]
```

- Token `secrets.token_urlsafe(32)` ile üretilir, DB'ye **hash'i** yazılır.
- E-posta gönderimi için bir sağlayıcı gerekir (Resend / SendGrid / SES).
- Rate limiting: `slowapi` veya Redis tabanlı sayaç.

## Security Considerations

1. **Kullanıcı sayımı (enumeration):** `forgot-password` e-posta kayıtlı olsun
   olmasın **aynı** yanıtı ve **aynı** gecikmeyi döndürmeli.
2. **Token saklama:** Sıfırlama token'ı düz metin saklanmamalı.
3. **Tek kullanım + kısa ömür:** 1 saat, kullanıldığında iptal.
4. **Şifre değişince oturumları düşür:** JWT stateless olduğundan bu ancak
   `User` tablosuna bir `token_version` alanı eklenip JWT payload'ında
   taşınmasıyla mümkündür.
5. **Rate limiting:** IP + hesap bazlı; `forgot-password` özellikle spam'e açık.

### Token deposu hakkında (mevcut ödünleşim)

Token şu an `localStorage`'da tutuluyor ve XSS durumunda okunabilir. Daha
güvenli seçenek `httpOnly` + `Secure` + `SameSite=Lax` cookie'dir; ancak bu
backend'in token'ı yanıt gövdesi yerine `Set-Cookie` ile göndermesini gerektirir.

Geçiş yapılırsa değişmesi gerekenler:

- Backend: `Set-Cookie` ile token; CORS `allow_credentials=True` (zaten açık).
- Frontend: `client.ts` içinde `credentials: "include"`; `getToken`/`setToken`
  kaldırılır. Client bu değişikliğe hazır — token erişimi tek dosyada izole.
- CSRF koruması gerekir (cookie tabanlı oturumda Bearer'ın doğal bağışıklığı yok).

## Dependencies

- E-posta sağlayıcısı (Resend / SendGrid / AWS SES)
- `slowapi` veya Redis (rate limiting)
- Yeni migration: `password_reset_tokens`, `email_verification_tokens`,
  `users.email_verified`, `users.token_version`
