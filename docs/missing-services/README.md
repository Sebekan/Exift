# Missing Services

Bu klasör, **UI açısından gerçekten gerekli olan ama backend'de bulunmayan**
servisleri belgeler.

## Kural

Bu servislerin hiçbiri sahte (mock/fake) olarak uygulanmadı. Backend'de karşılığı
olmayan bir özellik için:

- Sahte endpoint **yazılmaz**,
- `setTimeout`/`Promise.resolve` ile başarı **taklit edilmez**,
- UI'da çalışıyormuş gibi görünen ölü buton **bırakılmaz**.

Bunun yerine ya özellik dürüstçe "yakında" olarak işaretlenir (örn. bildirim
tercihleri), ya da hiç gösterilmez; ve gereksinim buraya yazılır.

## Öncelik sırası

| # | Servis | Belge | Öncelik | Neden |
| --- | --- | --- | --- | --- |
| 1 | Okunmamış mesaj sayacı | [MESSAGING.md](./MESSAGING.md) | HIGH | Kullanıcı yeni mesajı fark edemiyor |
| 2 | Bildirimler | [NOTIFICATIONS.md](./NOTIFICATIONS.md) | HIGH | Geri dönüş (retention) için temel |
| 3 | Şifre sıfırlama | [AUTH.md](./AUTH.md) | HIGH | Şifresini unutan kullanıcı kilitleniyor |
| 4 | Rate limiting | [AUTH.md](./AUTH.md) | HIGH | Kaba kuvvet saldırısına açık |
| 5 | Görsel silme | [UPLOAD.md](./UPLOAD.md) | MEDIUM | Cloudinary'de yetim dosya birikiyor |
| 6 | Görüntülenme sayacı | [LISTINGS.md](./LISTINGS.md) | MEDIUM | Satıcı ilanının performansını göremiyor |
| 7 | ~~Taslak / pasif ilan~~ ✅ | [LISTINGS.md](./LISTINGS.md) | — | Uygulandı: `is_published` + unpublish/republish |
| 8 | Herkese açık profil | [PROFILE.md](./PROFILE.md) | MEDIUM | Satıcıya güven sinyali yok |
| 9 | Hesap silme | [PROFILE.md](./PROFILE.md) | MEDIUM | KVKK yükümlülüğü, şu an manuel |
| 10 | Şikayet / engelleme | [MODERATION.md](./MODERATION.md) | MEDIUM | Kötüye kullanım yolu yok |
| 11 | E-posta değiştirme | [AUTH.md](./AUTH.md) | MEDIUM | Profilde salt-okunur gösteriliyor |
| 12 | Kayıtlı arama | [SEARCH.md](./SEARCH.md) | LOW | İyileştirme |
| 13 | E-posta gönderim sağlayıcısı | [AUTH.md](./AUTH.md) | HIGH | Doğrulama altyapısı hazır, gönderim yok |
| 14 | Müze onay mekanizması | [MUSEUM-APPROVAL.md](./MUSEUM-APPROVAL.md) | HIGH | `pending` başvurular hiçbir yolla onaylanamıyor |
