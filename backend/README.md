# Exift Backend

Exift pazar yerinin FastAPI servisi. PostgreSQL üzerinde çalışır, kimlik doğrulamayı JWT ile
yapar ve görselleri Cloudinary'ye yükler. Tüm uçlar `/api/` önekiyle yayınlanır.

Genel proje tanıtımı için kök dizindeki [`README.md`](../README.md) dosyasına bakın.

## Kurulum

Gereksinimler: Python 3.11+ ve çalışan bir PostgreSQL sunucusu.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

pip install -r requirements.txt
```

`.env.example` dosyasını `.env` olarak kopyalayıp değerleri doldurun, sonra veritabanını
hazırlayıp sunucuyu başlatın:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

- API: [http://localhost:8000](http://localhost:8000)
- Swagger arayüzü: [http://localhost:8000/docs](http://localhost:8000/docs)

## Ortam Değişkenleri

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/exift` | PostgreSQL bağlantısı |
| `JWT_SECRET_KEY` | `dev-secret-key-degistir` | Token imzalama anahtarı, üretimde mutlaka değiştirin |
| `JWT_ALGORITHM` | `HS256` | İmzalama algoritması |
| `JWT_EXPIRE_MINUTES` | `10080` | Token ömrü (7 gün) |
| `CLOUDINARY_CLOUD_NAME` | — | Cloudinary hesap adı |
| `CLOUDINARY_API_KEY` | — | Cloudinary anahtarı |
| `CLOUDINARY_API_SECRET` | — | Cloudinary gizli anahtarı |
| `APP_ENV` | `development` | Çalışma ortamı |
| `CORS_ORIGINS` | `http://localhost:3000` | İzin verilen kaynaklar, virgülle ayrılır |

`DATABASE_URL` değeri `postgres://` ile başlıyorsa `config.py` içindeki doğrulayıcı bunu
otomatik olarak `postgresql://` biçimine çevirir; Coolify ve Heroku bu biçimi verdiği için
gereklidir.

`.env` dosyası sürüm kontrolüne girmez. Gerçek anahtarları asla depoya işlemeyin.

## Dizin Yapısı

```
app/
  main.py           # FastAPI uygulaması, CORS ve router kayıtları
  config.py         # Pydantic Settings ile ortam değişkenleri
  database.py       # Engine, SessionLocal, Base, get_db
  dependencies.py   # get_current_user ve isteğe bağlı kullanıcı bağımlılıkları
  routers/
    auth.py         # Kayıt, giriş, profil, şifre değiştirme
    products.py     # İlan listeleme, oluşturma, satış, beğeni, sandık
    comments.py     # Yorumlar ve yorum beğenileri
    chats.py        # Alıcı-satıcı mesajlaşması
    upload.py       # Cloudinary görsel yükleme
  models/           # SQLAlchemy tabloları
  schemas/          # Pydantic istek/yanıt şemaları
  utils/
    security.py     # bcrypt hash'leme, JWT üretimi
    cloudinary.py   # Görsel yükleme yardımcısı
    phone.py        # Telefon numarası doğrulama ve normalize etme
alembic/
  versions/         # Migration dosyaları
```

## Veritabanı

Tablolar: `users`, `products`, `comments`, `comment_likes`, `likes`, `favorites`, `chats`,
`chat_messages`. Birincil anahtarların tamamı UUID'dir.

Model değiştirdiğinizde yeni bir migration üretin:

```bash
alembic revision --autogenerate -m "kisa aciklama"
alembic upgrade head
```

Otomatik üretilen dosyayı uygulamadan önce mutlaka gözden geçirin; Alembic zaman zaman
gereksiz veya hatalı komut üretir. Geri almak için `alembic downgrade -1`.

Veritabanında kayıt varken zorunlu (`nullable=False`) bir kolon eklemeyin; migration hata
verir. Önce `nullable=True` ile ekleyip veriyi doldurun, ardından ikinci bir migration ile
zorunlu hale getirin.

## Kimlik Doğrulama

Kayıt ve giriş uçları `access_token` döner. İstemci bu tokenı `Authorization: Bearer <token>`
başlığıyla gönderir. Şifreler bcrypt ile hash'lenir, düz metin olarak saklanmaz.

Korumalı uçlar `get_current_user` bağımlılığını kullanır. Oturum açmış kullanıcıya göre
zenginleşen ama girişsiz de çalışan uçlar (ilan listesi gibi) `get_current_user_optional`
kullanır.

## Doğrulama Kuralları

**Telefon** — `app/utils/phone.py` içindeki `normalize_phone`, Google'ın libphonenumber
kütüphanesinin Python portu olan `phonenumbers` ile çalışır. Ücretsiz, sınırsız ve çevrimdışıdır;
harici bir servise istek atmaz.

- Girdi `TR` varsayılan ülkesiyle ayrıştırılır, yani `0532 123 45 67` kabul edilir.
- Numaralandırma planına göre geçersiz numaralar reddedilir.
- Yalnızca cep telefonu (`MOBILE` veya `FIXED_LINE_OR_MOBILE`) kabul edilir.
- Veritabanına her zaman E164 biçiminde yazılır: `+905321234567`.

Bu doğrulama numaranın biçimini denetler, hattın gerçekten açık olduğunu veya kullanıcıya ait
olduğunu kanıtlamaz. Gerçek sahiplik doğrulaması için SMS ile tek kullanımlık kod göndermek
gerekir; şu an böyle bir entegrasyon yoktur.

**E-posta** — Şu an yalnızca Pydantic `EmailStr` ile biçim denetimi yapılır. Alan adının
gerçekten e-posta alabildiğini sınamak için `email-validator` paketinin `check_deliverability`
seçeneği kullanılabilir; paket `pydantic[email]` ile birlikte zaten kurulur.

**Şifre** — En az 6 karakter.

## Hata Biçimi

Doğrulama hataları `400` durum koduyla ve Türkçe mesaj içeren `detail` alanıyla döner:

```json
{ "detail": "Geçerli bir telefon numarası girin." }
```

Frontend bu mesajı doğrudan kullanıcıya gösterir, dolayısıyla mesajların anlaşılır ve Türkçe
olması gerekir.
