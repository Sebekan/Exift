# Project Audit

**Tarih:** 14 Ağustos 2026
**Kapsam:** Next.js 16 frontend (`src/`) + FastAPI backend (`backend/`)
**Durum:** Bu belgedeki CRITICAL ve HIGH bulguların tamamı giderildi. Her madde
`Durum:` satırıyla işaretlidir.

---

## Severity tanımları

| Seviye | Anlam |
| --- | --- |
| **CRITICAL** | Özellik tamamen çalışmıyor veya veri/güvenlik riski var. |
| **HIGH** | Özellik yanlış çalışıyor ya da kullanıcıyı çıkmaza sokuyor. |
| **MEDIUM** | Çalışıyor ama kalite/UX/bakım borcu yaratıyor. |
| **LOW** | İyileştirme, cila. |

---

## Critical Bugs

### C1 — Kayıt olma tamamen kırıktı (iki ayrı sebep) · CRITICAL
**Durum: DÜZELTİLDİ**

İki bağımsız hata aynı akışı kilitliyordu:

1. **Frontend telefon göndermiyordu.** `api.auth.register()` yalnızca
   `{nickname, email, password}` yolluyordu; backend `UserRegister` şeması
   `phone: str` alanını **zorunlu** tanımlıyordu. Her kayıt denemesi `422`
   dönüyordu. Kayıt formunda telefon alanı hiç yoktu.
2. **Backend telefonu kaydetmiyordu.** `auth.py` içinde `User(...)` nesnesi
   **iki kez** oluşturuluyordu; ikinci nesne `phone` alanı olmadan
   birincinin üzerine yazıyordu. Yani doğrulama çalışıyor ama sonuç atılıyordu:

   ```python
   user = User(..., phone=phone)   # doğrulanmış telefon
   user = User(...)                # ← üzerine yazıyor, phone kayboluyor
   db.add(user)
   ```

**Çözüm:** Yinelenen nesne kaldırıldı; `AuthForm`'a E.164 ülke kodu seçicili
telefon alanı eklendi (`src/lib/phone.ts`, `src/components/auth/PhoneField.tsx`).
`UserOut` artık `phone` döner.

---

### C2 — İlan silme her zaman 500 veriyordu · CRITICAL
**Durum: DÜZELTİLDİ**

`likes`, `favorites`, `chats` ve `chat_messages` tablolarının `products.id`'ye FK
bağı vardı ama ne ORM `cascade` ne de DB `ON DELETE` tanımlıydı. Bir ilan
beğenilmiş/favorilenmiş/üzerine sohbet açılmışsa `db.delete(product)` bir
`IntegrityError` fırlatıyor, kullanıcı ham 500 görüyordu.

**Çözüm:** `delete_product` bağımlı kayıtları doğru sırada temizliyor
(chat_messages → chats → likes → favorites → comments → product). Duman testi
bu senaryoyu doğruluyor (`backend/tests/smoke_test.py`, bölüm 11).

---

### C3 — İlan oluşturma base64 data URI gönderiyordu · CRITICAL
**Durum: DÜZELTİLDİ**

`ilan-ver` sayfası `FileReader.readAsDataURL()` ile ürettiği base64 dizesini
doğrudan `image_url` olarak POST ediyordu. Sütun `String(500)`; tipik bir data
URI yüz binlerce karakter → DB hatası. `/api/upload/image` endpoint'i mevcuttu
ama **hiç çağrılmıyordu**.

**Çözüm:** `ImageUploader` dosyayı seçilir seçilmez Cloudinary'ye yüklüyor,
state'te yalnızca kalıcı `https` URL tutuluyor. Backend ayrıca uzun/şemasız
URL'lere anlaşılır bir `400` dönüyor (`validate_images`).

---

### C4 — Cloudinary API anahtarları kaynak koda gömülüydü · CRITICAL (Güvenlik)
**Durum: DÜZELTİLDİ**

`backend/app/config.py` gerçek kimlik bilgilerini **varsayılan değer** olarak
taşıyordu ve bu dosya git'te izleniyor:

```python
CLOUDINARY_API_KEY: str = "698931987198793"
CLOUDINARY_API_SECRET: str = "SKMZ2mjKAwqmbZRW8le7T6fXD0A"
```

**Çözüm:** Varsayılanlar boş dizeye çekildi; anahtarlar yalnızca ortam
değişkeninden okunuyor. `cloudinary_configured` kontrolü eklendi — yapılandırma
yoksa upload `503` ile açıkça reddediliyor. `APP_ENV=production` iken varsayılan
JWT anahtarı kullanılırsa uygulama başlangıçta hata veriyor.

> ⚠️ **Yapılması gereken (kod dışı):** Bu anahtarlar git geçmişinde durmaya devam
> ediyor. Cloudinary panelinden **iptal edilip yeniden üretilmeli**.

---

### C5 — Yorumlar uçtan uca çalışmıyordu · CRITICAL
**Durum: DÜZELTİLDİ**

`apiProductToProduct` her üründe `comments: []` sabitliyordu ve yorum listesi
hiçbir yerde çekilmiyordu. Sonuçlar:
- Her ilanda "0 yorum" görünüyordu.
- `CommentSection` her zaman boş listeyi render ediyordu.
- Gönderilen yorum POST ediliyor ama ekranda asla görünmüyordu.
- "Öne Çıkanlar" sıralaması sabit 0 üzerinden hesaplanıyordu.

**Çözüm:** `commentService` eklendi; `CommentSection` yorumları gerçekten
çekiyor, iyimser beğeni/silme yapıyor. Backend `author_id`, `is_mine`,
`is_liked`, `author_avatar_url` döndürüyor (N+1 sorgu da giderildi).

---

### C6 — Sahiplik kontrolü imkânsızdı · CRITICAL
**Durum: DÜZELTİLDİ**

Frontend `Product` tipinde `sellerId` yoktu (`sellerNickname` string'i vardı) ve
`UserProfile` tipinde `id` yoktu. Karşılaştırılacak iki kimlik de mevcut
değildi; bu yüzden "Düzenle/Sil" aksiyonları hiç yazılmamıştı. `profil`
sayfası ilanları **nickname string eşitliğiyle** filtreliyordu.

**Çözüm:** `Product.seller.id` ve `UserProfile.id` eklendi. Tek merkezî sahiplik
modülü: `src/lib/ownership.ts` (`getProductActions`). Profil artık
`GET /api/products/mine` kullanıyor.

---

### C7 — Cloudinary görselleri `next/image` tarafından reddediliyordu · CRITICAL
**Durum: DÜZELTİLDİ**

`next.config.ts` yalnızca `images.unsplash.com`'a izin veriyordu. Yüklenen her
görsel `res.cloudinary.com`'da barındığı için **tüm kullanıcı görselleri**
çalışma zamanında hata verecekti.

**Çözüm:** `res.cloudinary.com` `remotePatterns`'a eklendi.

---

## Frontend Architecture

### Öncesi
- `src/lib/api.ts` — 316 satırlık tek dosya; tip tanımları, token yönetimi ve
  tüm endpoint'ler bir arada.
- `AppDataContext` tüm ürünleri (`limit: 100` × 2 çağrı) global state'e
  dolduruyordu; her sayfa bu bayat listeden filtreliyordu.
- Sayfalama, sunucu tarafı arama ve kategori filtresi kullanılmıyordu — backend
  destekliyor olmasına rağmen filtreleme istemcide yapılıyordu.
- Hata yönetimi: `catch { }` (sessiz yutma) veya ham `e.message`.

### Sonrası
```
src/lib/api/        client.ts (token, timeout, 401, interceptor) · errors.ts · types.ts
src/services/       auth · listing · comment · chat · upload · mappers
src/hooks/          useAsyncData · usePaginatedListings · useDebounced · useResettableState
src/lib/            ownership.ts · validation.ts · phone.ts · format.ts · cn.ts
src/components/ui/  Button · Field · Modal · Tabs · Avatar · Badge · States
```

---

## Backend Architecture

FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL. Katmanlar: `routers/` →
`models/`, `schemas/` (Pydantic), `utils/` (security, phone, cloudinary).

**Not:** `app/services/` klasörü var ama **boş**. İş mantığı router'ların
içinde. Mevcut ölçekte kabul edilebilir; büyüme hâlinde ilk bölünmesi gereken
yer burası (bkz. ARCHITECTURE.md → Scalability).

---

## Existing Backend Services

| Servis | Endpoint | Method | Auth | Notlar |
| --- | --- | --- | --- | --- |
| Auth | `/api/auth/register` | POST | — | nickname, email, password, phone |
| Auth | `/api/auth/login` | POST | — | E-posta artık harf duyarsız |
| Auth | `/api/auth/me` | GET | ✅ | `phone` eklendi |
| Auth | `/api/auth/me` | PUT | ✅ | `avatar_url`, `phone` eklendi |
| Auth | `/api/auth/change-password` | POST | ✅ | |
| Products | `/api/products/` | GET | opsiyonel | `category`, `district`, `q`, `min_price`, `max_price`, `sort`, `page`, `limit` |
| Products | `/api/products/museum` | GET | opsiyonel | satılmışlar, sayfalı |
| Products | `/api/products/favorites` | GET | ✅ | sıralama korunur (**yeni**) |
| Products | `/api/products/mine` | GET | ✅ | **YENİ** — profil için |
| Products | `/api/products/{id}` | GET | opsiyonel | |
| Products | `/api/products/` | POST | ✅ | doğrulama eklendi |
| Products | `/api/products/{id}` | PUT | ✅ + sahiplik | alan bazlı doğrulama |
| Products | `/api/products/{id}` | DELETE | ✅ + sahiplik | FK temizliği (**düzeltildi**) |
| Products | `/api/products/{id}/sell` | POST | ✅ + sahiplik | |
| Products | `/api/products/{id}/like` | POST | ✅ | |
| Products | `/api/products/{id}/favorite` | POST | ✅ | |
| Comments | `/api/products/{id}/comments` | GET | opsiyonel | `is_mine`/`is_liked` (**yeni**) |
| Comments | `/api/products/{id}/comments` | POST | ✅ | |
| Comments | `/api/comments/{id}/like` | POST | ✅ | |
| Comments | `/api/comments/{id}` | DELETE | ✅ + sahiplik | |
| Chats | `/api/chats/contact/{product_id}` | POST | ✅ | idempotent |
| Chats | `/api/chats/` | GET | ✅ | N+1 giderildi |
| Chats | `/api/chats/{id}` | GET | ✅ + katılımcı | |
| Chats | `/api/chats/{id}/messages` | POST | ✅ + katılımcı | |
| Upload | `/api/upload/image` | POST | ✅ | `folder` parametresi (**yeni**) |

---

## Service Mapping (öncesi → sonrası)

| Servis | Önce | Sonra |
| --- | --- | --- |
| Register | **BROKEN** (422) | CONNECTED |
| Login | CONNECTED | CONNECTED |
| Session restore | PARTIALLY_CONNECTED | CONNECTED |
| Profil güncelleme | PARTIALLY_CONNECTED (hata yutuluyordu) | CONNECTED |
| Avatar yükleme | **MOCK** (base64, atılıyordu) | CONNECTED |
| Şifre değiştirme | **BACKEND_EXISTS_UI_MISSING** | CONNECTED |
| Ürün listeleme | PARTIALLY_CONNECTED (istemci filtresi) | CONNECTED (sunucu filtresi + sayfalama) |
| Arama | **UI_EXISTS_BACKEND_UNUSED** | CONNECTED (debounce'lu) |
| Kendi ilanları | **MOCK** (nickname eşleşmesi) | CONNECTED (`/mine`) |
| İlan düzenleme | **BACKEND_EXISTS_UI_MISSING** | CONNECTED |
| İlan silme | **BROKEN** (500) | CONNECTED |
| Satıldı işaretleme | **BACKEND_EXISTS_UI_MISSING** | CONNECTED |
| Görsel yükleme | **BACKEND_EXISTS_UI_MISSING** | CONNECTED |
| Yorum listeleme | **BROKEN** (hep boş) | CONNECTED |
| Yorum silme | **BACKEND_EXISTS_UI_MISSING** | CONNECTED |
| Sohbet | PARTIALLY_CONNECTED | CONNECTED |
| Müze | PARTIALLY_CONNECTED | CONNECTED (sayfalı) |

---

## Mock Services (temizlendi)

| Dosya | Durum |
| --- | --- |
| `src/data/products.json` (223 satır) | **SİLİNDİ** — hiçbir yerde import edilmiyordu |
| `src/data/current-user.json` | **SİLİNDİ** — ölü kod |
| `src/data/museum.json` | **SİLİNDİ** — ölü kod |
| `src/data/categories.json` | Korundu — statik içerik (meşru) |
| `src/data/districts.json` | Korundu — statik içerik (meşru) |
| `src/data/site-config.json` | Korundu — statik içerik (meşru) |

---

## Authentication Problems

| # | Sorun | Seviye | Durum |
| --- | --- | --- | --- |
| A1 | Kayıt 422 ile kırık (C1) | CRITICAL | DÜZELTİLDİ |
| A2 | Korumalı sayfalar oturum yüklenirken kullanıcıyı dışarı atıyordu | HIGH | DÜZELTİLDİ — `RequireAuth` üç durumlu (`loading`/`authenticated`/`anonymous`) |
| A3 | Token süresi dolduğunda UI oturumu açık sanıyordu | HIGH | DÜZELTİLDİ — `onUnauthorized` aboneliği ile global çıkış |
| A4 | `?redirect=` açık yönlendirmeye (open redirect) açıktı | MEDIUM | DÜZELTİLDİ — `safeRedirect()` yalnızca site içi yol kabul ediyor |
| A5 | Form doğrulaması yoktu | MEDIUM | DÜZELTİLDİ — alan bazlı, blur'da tetiklenen doğrulama |
| A6 | Bozuk token 500 üretiyordu (`uuid.UUID()` istisnası) | MEDIUM | DÜZELTİLDİ — 401 |
| A7 | `is_active=False` kullanıcı giriş yapabiliyordu | MEDIUM | DÜZELTİLDİ |
| A8 | Şifre görünürlük/güç göstergesi yok | LOW | EKLENDİ |

---

## Profile Problems

| # | Sorun | Seviye | Durum |
| --- | --- | --- | --- |
| P1 | İlanlar nickname string'iyle eşleşiyordu (C6) | CRITICAL | DÜZELTİLDİ |
| P2 | Avatar yükleme sessizce atılıyordu | HIGH | DÜZELTİLDİ — Cloudinary + `avatar_url` |
| P3 | "Alınan Yorum" sayacı hep 0 gösteriyordu | HIGH | DÜZELTİLDİ — "Toplam beğeni" ile değiştirildi (gerçek veri) |
| P4 | E-posta/Şifre/Bildirim satırları tıklanamazdı (ölü UI) | HIGH | DÜZELTİLDİ — şifre değiştirme gerçek form; e-posta salt-okunur olarak dürüstçe işaretlendi |
| P5 | `updateProfile` hatayı yutup yerel state'i güncelliyordu (yalan başarı) | HIGH | DÜZELTİLDİ — gerçek sonuç döner |
| P6 | Telefon düzenlenemiyordu | MEDIUM | DÜZELTİLDİ |
| P7 | Boş durumlar tek satır metindi | MEDIUM | DÜZELTİLDİ — aksiyonlu `EmptyState` |

---

## Listing Problems

| # | Sorun | Seviye | Durum |
| --- | --- | --- | --- |
| L1 | Düzenleme ekranı hiç yoktu | CRITICAL | EKLENDİ — `/ilan/[id]/duzenle` |
| L2 | Silme 500 veriyordu (C2) | CRITICAL | DÜZELTİLDİ |
| L3 | Görsel yükleme base64 (C3) | CRITICAL | DÜZELTİLDİ |
| L4 | Çoklu görsel / sıralama yoktu | HIGH | EKLENDİ |
| L5 | "Satıldı işaretle" UI'ı yoktu | HIGH | EKLENDİ |
| L6 | Form varsayılanları sahte veriyle doluydu ("Hiç Takılmamış Söz Yüzüğü", "500") | MEDIUM | DÜZELTİLDİ — boş form |
| L7 | Detay sayfası global listeden okuyordu → derin bağlantı/yenileme kırıktı | HIGH | DÜZELTİLDİ — `GET /api/products/{id}` |
| L8 | Kaydedilmemiş değişiklik uyarısı yoktu | MEDIUM | EKLENDİ |

---

## Chat Problems

| # | Sorun | Seviye | Durum |
| --- | --- | --- | --- |
| CH1 | Sohbet listesi **satıcının** adını gösteriyordu — satıcı kendi adını görüyordu | HIGH | DÜZELTİLDİ — `other_party_*` alanları |
| CH2 | Sohbette ilan fiyatı/durumu yoktu | MEDIUM | EKLENDİ |
| CH3 | Sahip için "Düzenle" kısayolu yoktu (görev #21) | HIGH | EKLENDİ — `is_seller` ile |
| CH4 | Mesaj gönderimi iyimser değildi, hata sessizdi | MEDIUM | DÜZELTİLDİ |
| CH5 | Sohbet listesi N+1 sorgu yapıyordu | MEDIUM | DÜZELTİLDİ |
| CH6 | Tarih ayracı yoktu | LOW | EKLENDİ |

---

## UX Problems

| # | Sorun | Seviye | Durum |
| --- | --- | --- | --- |
| U1 | Yükleme durumu yok (boş ekran veya "Yükleniyor...") | HIGH | DÜZELTİLDİ — skeleton'lar |
| U2 | Hata durumu yok — hatalar sessizce yutuluyordu | HIGH | DÜZELTİLDİ — `ErrorState` + tekrar dene |
| U3 | Boş durumlar zayıf | MEDIUM | DÜZELTİLDİ |
| U4 | Footer'daki 3 kurumsal bağlantı `#` idi | MEDIUM | DÜZELTİLDİ — 3 sayfa oluşturuldu |
| U5 | Silme onayı yok | HIGH | EKLENDİ — `ConfirmDialog` |
| U6 | Görsel yüklenemezse kırık ikon | LOW | DÜZELTİLDİ — `onError` yedeği |

---

## Filter Problems

Bu bölüm ikinci elden geçirmede (14 Ağustos 2026) eklendi.

### F1 — "Filtre uygulanıyor ama temizlenemiyor" · CRITICAL
**Durum: DÜZELTİLDİ**

Bildirilen belirti: *filtre uygulayıp sayfayı yenileyince filtre kalıyor ve
kullanıcı filtreyi silemiyor.*

**Kök neden (tek değil, üç ayrı kusurun birleşimi):**

1. **Masaüstünde temizleme arayüzü hiç yoktu.** Arama girdisi ve onun `×`
   düğmesi `src/app/page.tsx` içinde `md:hidden` sınıfıyla sarılıydı — yani
   768px üzerinde görünmüyordu. `?q=` ile filtrelenmiş bir listeye ulaşan
   masaüstü kullanıcısının filtreyi kaldırmak için **adres çubuğunu elle
   düzenlemekten başka yolu yoktu.**
2. **Başlıktaki arama kutusu URL'i yansıtmıyordu.** Header kendi yerel
   `useState`'ini kullanıyordu; `?q=foo` ile gelindiğinde kutu boş görünüyor,
   sonuçlar ise filtreli kalıyordu. Kullanıcı "filtre yok" sanıyordu.
3. **Kategori filtresi URL'de değildi.** Bileşen içi `useState` olduğu için
   paylaşılamıyor, geri/ileri tuşlarıyla gezilemiyor, yenilemede sessizce
   sıfırlanıyordu — aramanın davranışıyla tutarsızdı.

**Çözüm:** Filtre state'inin tek doğruluk kaynağı URL yapıldı
(`src/lib/filters.ts` + `src/hooks/useListingFilters.ts`). Bu, sorunu yapısal
olarak imkânsız hâle getirir: chip'i kaldırmak query parametresini kaldırmak
demektir; arkada gizli bir kopya kalmaz. Arama kutusu artık **her kırılımda**
görünür ve her aktif filtre kaldırılabilir bir chip olarak listelenir.

**Ürün kararı:** Filtreler yenilemede korunur. Bu bilinçlidir — filtreli liste
paylaşılabilir ve yer imine eklenebilir olmalıdır. Şart, görev tanımındaki
kuralla sağlanır: *kullanıcı hiçbir durumda filtreyi temizleyemez hâlde
kalmamalı.* Her chip'te `×`, birden fazla filtre varsa "Tümünü Temizle" vardır.

### F2 — Fiyat/sıralama filtresi yoktu · HIGH
**Durum: DÜZELTİLDİ (backend + frontend)**

`GET /api/products/` yalnızca `category`, `district`, `q` destekliyordu.
Backend'e `min_price`, `max_price` ve `sort` eklendi (`SortOption` enum'u:
`newest`, `oldest`, `price_asc`, `price_desc`). Uydurulmadı — gerçekten
uygulandı ve OpenAPI şemasında görünüyor.

### F3 — ILIKE joker karakterleri kaçırılmıyordu · HIGH (Güvenlik/Performans)
**Durum: DÜZELTİLDİ**

Arama `f"%{q}%"` ile doğrudan `ILIKE`'a veriliyordu. Kullanıcı `%` yazdığında
desen `%%%` oluyor ve **tüm tablo** dönüyordu; `_` ile de tek karakter joker
elde edilebiliyordu. `escape_like()` eklendi ve `ilike(..., escape="\\")`
kullanılıyor. Ayrıca `q` uzunluğu 100 karakterle sınırlandı (pahalı tarama
önlemi).

### F4 — Sayfalama sırası kararsızdı · MEDIUM
**Durum: DÜZELTİLDİ**

Fiyata göre sıralamada eşit fiyatlı kayıtların sırası sayfalar arasında
değişebiliyor, aynı ilan iki sayfada görünebiliyordu. Tüm sıralamalara
`created_at` + `id` ikincil anahtarları eklendi.

### F5 — API adresindeki sondaki eğik çizgi · MEDIUM
**Durum: DÜZELTİLDİ**

`NEXT_PUBLIC_API_URL` sonunda `/` ile verildiğinde (üretim yapılandırmasında
olduğu gibi: `https://api.exift.harbidigital.com/`) istekler
`…com//api/products/` biçiminde çift eğik çizgiyle çıkıyordu. `client.ts`
artık sondaki eğik çizgileri temizliyor.

## Layout Problems

### L10 — İçerik gereğinden dar container'da · HIGH
**Durum: DÜZELTİLDİ**

Tüm sayfalar `max-w-[1300px]` + `px-[5%]` kullanıyordu. 1920px'lik bir ekranda
yüzde tabanlı boşluk 96px, ardından içerik 1300px'e kırpılıyor ve iki yanda
~310px ölü alan kalıyordu. `Container` bileşeni eklendi: sabit basamaklı iç
boşluk (`px-4 → sm:px-6 → lg:px-8 → xl:px-12`) ve içerik türüne göre genişlik
(`narrow` 780px, `content` 1080px, `wide` 1600px). Izgara 2xl'de 4 sütuna çıkar.

## Navigation Problems

### N1 — Mobil menü header'ın içinde kırpılıyordu · CRITICAL
**Durum: DÜZELTİLDİ**

Menü açıldığında panel yalnızca header yüksekliğinde (68px) görünüyor, sayfa
içeriği menünün altından sızıyordu.

**Kök neden:** Header'da `backdrop-blur-xl` (yani `backdrop-filter`) var.
CSS'e göre `filter` veya `backdrop-filter` tanımlı bir element, `position:
fixed` torunları için **containing block** oluşturur. Menü header'ın DOM
alt ağacında olduğu için `fixed inset-0` viewport'a değil header'ın kutusuna
göre çözülüyordu.

**Çözüm:** Menü `createPortal` ile `document.body`'ye taşındı. Doğrulama:
panelin kapsayıcısı artık `document.body`'nin doğrudan çocuğu ve yüksekliği
viewport ile birebir eşit (714px = 714px), header'ın 69px'i değil.

### N2 — Gezinme etiketleri tutarsızdı · MEDIUM
**Durum: DÜZELTİLDİ**

Alt gezinme "Anasayfa"/"Sandık" derken header "Ana Sayfa"/"Sandığım"
diyordu — kullanıcıya iki farklı yer gibi görünüyor. Etiketler birleştirildi;
alt gezinmeye "Mesajlar" (sohbet rozetli) eklendi ve "İlan Ver" ana aksiyon
olarak görsel öne çıkarıldı.

### N3 — Auth rotaları İngilizceydi · MEDIUM
**Durum: DÜZELTİLDİ**

`/auth/sign-in` → `/giris`, `/auth/sign-up` → `/kayit`. Eski rotalar
silinmedi; `?redirect=` parametresini koruyarak 307 ile yönlendiriyor
(paylaşılmış bağlantılar ve yer imleri kırılmasın).

## UI Refinements (ikinci geri bildirim turu)

### R10 — Mobil menü açılmıyordu (containing block) · CRITICAL
**Durum: DÜZELTİLDİ** — bkz. N1.

### R11 — Filtre kutusuna yazınca uygulama çöküyordu · CRITICAL
**Durum: DÜZELTİLDİ**

`FilterBar`, debounce sonucunu **render sırasında** `onChange` ile URL'e
yazıyordu; bu `router.replace`'i render fazında çağırmak demekti:

> Cannot update a component (`Router`) while rendering a different component
> (`FilterBar`) → Too many re-renders → Rendered more hooks than during the
> previous render

Kendi state'ini render sırasında güncellemek React'te desteklenir; **başka bir
bileşeni** güncellemek desteklenmez. URL yazımı `useEffect`'e taşındı. Dışarıdan
gelen değişiklik (chip ×, geri tuşu) `syncedTo` işaretçisiyle yakalanıyor —
taslak eziliyor ama kullanıcı yazarken imleç sona atlamıyor.

### R12 — Eski backend'e karşı çalışma zamanı çökmesi · HIGH
**Durum: DÜZELTİLDİ**

Frontend güncel, dağıtılmış API eski olduğunda `other_party_nickname`,
`product_price`, `is_seller` alanları `undefined` geliyor; `Avatar` içinde
`nickname.trim()` ve `formatPrice(undefined)` patlıyordu. Mapper'lar ve
`Avatar`/`formatPrice` savunmacı hâle getirildi. Eski yanıt şeklini taklit eden
bir vekil ile doğrulandı: Mesajlar, sohbet detayı ve profil çökmeden,
zarifçe eksik veriyle render ediliyor.

### R13 — İçerik gereğinden dar container'da · HIGH
**Durum: DÜZELTİLDİ** — `Container` bileşeni (narrow/content/wide/full).

### R14 — Hukuki sayfalar tek dar sütundu · MEDIUM
**Durum: DÜZELTİLDİ**

Tam genişlikte başlık şeridi + çok sütunlu masonry kart akışı
(`columns-1 → lg:columns-2 → 2xl:columns-3`). Ekran değerlendiriliyor ama kart
içi satır uzunluğu okunabilir kalıyor.

### R15 — Profil sekmeleri sıkışıyordu · MEDIUM
**Durum: DÜZELTİLDİ**

Sekme şeridi yerine kenar çubuğu (`ProfileSidebar`). Bölüm URL'de tutuluyor
(`?bolum=`), header menüsünden derin bağlantı verilebiliyor. Dar ekranda
yatay kayan şeride düşer.

### R16 — Profil düğmesi yalnızca bir bağlantıydı · MEDIUM
**Durum: DÜZELTİLDİ**

`UserMenu`: hesap kartı (ad + e-posta) ve Profilimi Görüntüle · İlanlarım ·
Sandığım · Ayarlar · Çıkış Yap. Dışarı tıklama ve Escape ile kapanır.

### R17 — İlan oluşturma uzun tek formdu · MEDIUM
**Durum: DÜZELTİLDİ**

3 adımlı sihirbaz (`Stepper`): Ürün Bilgileri → Fotoğraflar → Hikâye. Her adım
scroll gerektirmeden ekrana sığar; doğrulama adım bazlı. Tamamlanan adıma
dönülebilir, ileri atlanamaz. **Düzenleme tek sayfa kaldı** — orada amaç tek
alan değiştirmek, üç adım gezdirmek gereksiz sürtünme olurdu.

### R18 — Yönlendirme parametresi `redirect` idi · LOW
**Durum: DÜZELTİLDİ** — `?to=` olarak yeniden adlandırıldı.

### R19 — Kullanılmayan rotalar · LOW
**Durum: DÜZELTİLDİ**

`/auth/sign-in`, `/auth/sign-up` ve `/favoriler` yönlendirme shim'leri
kaldırıldı. Rota sayısı 16 → 13.

### R20 — API adresinde çift eğik çizgi · MEDIUM
**Durum: DÜZELTİLDİ** — `client.ts` sondaki `/` karakterlerini temizliyor.

## Responsive Problems

| # | Sorun | Seviye | Durum |
| --- | --- | --- | --- |
| R1 | Profil başlığındaki butonlar dar ekranda taşıyordu | MEDIUM | DÜZELTİLDİ |
| R2 | Modal'lar mobilde ortada, küçük | MEDIUM | DÜZELTİLDİ — alttan sheet |
| R3 | Gizlilik sayfasındaki tablo yatay taşma yaratabilirdi | MEDIUM | ÖNLENDİ — `overflow-x-auto` |
| R4 | Uzun başlık/nickname kartları bozuyordu | MEDIUM | DÜZELTİLDİ — `truncate`/`line-clamp` |
| R5 | Galeri okları mobilde görünmüyordu (yalnızca hover) | MEDIUM | DÜZELTİLDİ |

---

## Accessibility Problems

| # | Sorun | Seviye | Durum |
| --- | --- | --- | --- |
| X1 | Form input'larında `<label>` yoktu (yalnızca placeholder) | HIGH | DÜZELTİLDİ |
| X2 | Hata mesajları ekran okuyucuya bağlı değildi | HIGH | DÜZELTİLDİ — `aria-describedby` + `role="alert"` |
| X3 | Modal'da odak tuzağı/Escape yoktu | HIGH | DÜZELTİLDİ |
| X4 | Sekmelerde ARIA/klavye yoktu | MEDIUM | DÜZELTİLDİ — WAI-ARIA tabs |
| X5 | Görünür odak halkası yoktu | MEDIUM | DÜZELTİLDİ |
| X6 | "İçeriğe geç" bağlantısı yoktu | MEDIUM | EKLENDİ |
| X7 | `prefers-reduced-motion` desteklenmiyordu | MEDIUM | EKLENDİ |
| X8 | Aç/kapa butonlarında `aria-pressed` yoktu | LOW | EKLENDİ |
| X9 | `<div onClick>` ile tıklanabilir alanlar | MEDIUM | DÜZELTİLDİ — gerçek `<button>` |

---

## Security Problems

| # | Sorun | Seviye | Durum |
| --- | --- | --- | --- |
| S1 | Cloudinary anahtarları kodda (C4) | CRITICAL | DÜZELTİLDİ (+ **anahtar döndürme gerekli**) |
| S2 | Üretimde varsayılan JWT anahtarı sessizce kullanılabiliyordu | HIGH | DÜZELTİLDİ — başlangıçta hata |
| S3 | Açık yönlendirme (A4) | MEDIUM | DÜZELTİLDİ |
| S4 | Cloudinary ham hataları istemciye sızıyordu | MEDIUM | DÜZELTİLDİ — 502'ye normalize |
| S5 | Yükleme MIME tipi `startswith("image/")` ile gevşekti | MEDIUM | DÜZELTİLDİ — beyaz liste |
| S6 | Girdi uzunluğu sınırları yoktu (başlık/yorum/mesaj/bio) | MEDIUM | DÜZELTİLDİ |
| S7 | `CORS_ORIGINS` üretimde `*` olabilir | LOW | Belgelendi — ARCHITECTURE.md |
| S8 | Token `localStorage`'da (XSS'e açık) | MEDIUM | KABUL EDİLDİ + belgelendi → `docs/missing-services/AUTH.md` |

> **Not (S8):** `localStorage` bilinçli bir ödünleşimdir; backend cookie tabanlı
> oturum sunmuyor. httpOnly cookie'ye geçiş yolu AUTH.md'de tarif edildi.

---

## Performance Problems

| # | Sorun | Seviye | Durum |
| --- | --- | --- | --- |
| PF1 | Açılışta 200 ürün tek seferde çekiliyordu | HIGH | DÜZELTİLDİ — 24'lük sayfalama |
| PF2 | Arama istemcide, tüm veri üzerinde | HIGH | DÜZELTİLDİ — sunucu tarafı + 400ms debounce |
| PF3 | Yorum listesinde N+1 sorgu | MEDIUM | DÜZELTİLDİ — gruplu sorgu |
| PF4 | Sohbet listesinde N+1 sorgu | MEDIUM | DÜZELTİLDİ |
| PF5 | Context her render'da yeni nesne üretiyordu | MEDIUM | DÜZELTİLDİ — `useMemo`/`useCallback` |
| PF6 | Beğeni/favoride çift tıklama yarış koşulu | MEDIUM | DÜZELTİLDİ — bekleyen istek kilidi |
| PF7 | İstek zaman aşımı yoktu (sonsuz bekleme) | MEDIUM | DÜZELTİLDİ — 20s / yükleme 60s |
| PF8 | Sayfa değişince istekler iptal edilmiyordu | MEDIUM | DÜZELTİLDİ — `AbortController` |
| PF9 | Görsellerde `sizes` yok/eksik | LOW | DÜZELTİLDİ |

---

## Missing Services

Backend'de olmayan ama UI açısından gerekli servisler `docs/missing-services/`
altında belgelendi. **Hiçbiri sahte olarak uygulanmadı.**

| Servis | Belge | Öncelik |
| --- | --- | --- |
| Okunmamış mesaj sayacı, sohbet silme | `MESSAGING.md` | HIGH |
| Bildirimler | `NOTIFICATIONS.md` | HIGH |
| E-posta değiştirme/doğrulama, şifre sıfırlama, refresh token | `AUTH.md` | HIGH |
| Görüntülenme sayacı, taslak/pasif ilan | `LISTINGS.md` | MEDIUM |
| Herkese açık kullanıcı profili, hesap silme | `PROFILE.md` | MEDIUM |
| Şikayet etme, engelleme | `MODERATION.md` | MEDIUM |
| Kayıtlı arama, öneriler | `SEARCH.md` | LOW |
| Görsel silme (Cloudinary temizliği) | `UPLOAD.md` | MEDIUM |

---

## Test Results

`backend/tests/smoke_test.py` — 42 kontrol, tamamı geçiyor:

```
Kayıt (telefon kalıcı) · doğrulama · çakışmalar
Giriş (harf duyarsız) · bozuk token 401 · oturum
İlan oluşturma · doğrulama · base64 reddi
Sahiplik: başkasının ilanı 403 (düzenle + sil) · token'sız 401
Sahip düzenleme · /mine izolasyonu · favoriler
Yorumlar (author_id, is_mine) · başkasının yorumu 403
Sohbet (is_seller, other_party) · kendi ilanı 400
Profil (avatar_url, telefon çakışması)
Silme: bağımlı kayıtlarla 204 (500 değil) · temizlik doğrulaması
```

Frontend: `npx tsc --noEmit` temiz · `npm run lint` temiz · `npm run build` 13 rota.

---

## Priority (kalan işler)

### HIGH
0. **Backend'i yeniden dağıt.** `min_price` / `max_price` / `sort` parametreleri
   yereldeki koda eklendi ama `api.exift.harbidigital.com` üzerinde ESKİ sürüm
   çalışıyor. Dağıtım yapılmadan fiyat filtresi ve sıralama üretimde sessizce
   yok sayılır (bilinmeyen query parametresi hata vermez).
1. **Cloudinary anahtarlarını döndür** — git geçmişinde ifşa (C4).
2. Otomatik test altyapısı — `pytest` + `vitest`/Playwright. Şu an yalnızca
   duman testi var.
3. Okunmamış mesaj sayacı — `MESSAGING.md`.

### MEDIUM
4. Rate limiting — giriş/kayıt/mesaj uçlarında yok (kaba kuvvet riski).
5. Şifre sıfırlama akışı — `AUTH.md`.
6. Görüntülenme sayacı — `LISTINGS.md`.
7. `app/services/` katmanını doldur (router'lar şişiyor).
8. DB indeksleri: `products.seller_id`, `products.category`, `chats.buyer_id`.

### LOW
9. Sonsuz kaydırma ("Daha fazla" butonu yerine).
10. Kategori/ilçe verisini DB'ye taşı (şu an statik JSON).
11. `alembic` migration'ları FK'lara `ON DELETE CASCADE` ekleyecek şekilde
    güncellenebilir (uygulama katmanı çözümünün yerine).
