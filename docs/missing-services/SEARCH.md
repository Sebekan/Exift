# Search — eksik servisler

## Purpose

Aramayı basit bir metin eşleşmesinden keşif aracına dönüştürmek.

## Why UI Needs It

Mevcut arama çalışıyor (sunucu tarafı, debounce'lu) ama sınırlı:

- **Fiyat aralığı ve sıralama yok.** Pazar yerinde en çok kullanılan iki filtre.
- **Öneri (autocomplete) yok.** Kullanıcı ne arayabileceğini bilmiyor.
- **Sonuç bulunamadığında çıkmaz.** "Farklı bir kelime dene" diyoruz ama alternatif
  sunmuyoruz.
- **ILIKE ölçeklenmiyor.** `%kelime%` deseni indeks kullanamaz; ilan sayısı
  arttıkça sorgu tam tablo taramasına döner.

## Current Backend Status

| Var | Yok |
| --- | --- |
| `q` parametresi (`title` + `story` ILIKE) | Fiyat aralığı filtresi |
| `category` filtresi | Sıralama seçeneği |
| `district` filtresi | Arama önerileri / autocomplete |
| Sayfalama | Kayıtlı arama |
| | Full-text search / dil desteği |
| | Popüler aramalar |

## Required Endpoints

Mevcut `GET /api/products/` genişletilir (yeni endpoint gerekmez):

```
GET /api/products/?q=&category=&district=&min_price=&max_price=&sort=&page=&limit=
```

Ek olarak:

```
GET /api/search/suggestions?q=          # autocomplete
GET /api/search/popular                 # boş arama ekranı için
```

## Request Models

```python
class SortOption(str, Enum):
    newest = "newest"           # varsayılan (mevcut davranış)
    price_asc = "price_asc"
    price_desc = "price_desc"
    popular = "popular"         # likes + comments
```

## Response Models

```python
class SuggestionResponse(BaseModel):
    titles: list[str]           # eşleşen ilan başlıkları (en fazla 5)
    categories: list[str]       # eşleşen kategori id'leri

# ProductListResponse korunur — frontend buna bağımlı:
# { items, total, page, pages }
```

## Authentication

Yok — arama herkese açık. `get_current_user_optional` ile giriş yapmış
kullanıcıya `is_liked`/`is_favorited` doldurulur (mevcut davranış korunur).

## Authorization

Yok. Ancak `draft`/`paused` ilanlar sonuçlara **girmemeli**
(bkz. [LISTINGS.md](./LISTINGS.md)).

## Error Handling

| Durum | Kod | `detail` |
| --- | --- | --- |
| `min_price > max_price` | 400 | `"Minimum fiyat maksimumdan büyük olamaz."` |
| Geçersiz `sort` | 422 | Pydantic `Enum` doğrulaması |
| `limit` sınır dışı | 422 | Zaten `Query(ge=1, le=100)` ile korunuyor |

## Frontend Integration

Hazır olan taraf:

- `src/hooks/useDebounced.ts` — 400 ms debounce çalışıyor.
- `src/hooks/usePaginatedListings.ts` — `filterKey` ile filtre değişiminde
  sayfalama sıfırlanıyor; yeni filtreler bu anahtara eklenmesi yeterli.
- `src/services/listing.service.ts` — `ListingQuery` tipine alan eklenir.
- `src/app/page.tsx` — filtre çubuğu yapışkan, genişletmeye uygun.

Eklenecekler:

```
src/components/product/FilterDrawer.tsx    # mobil için alttan açılan filtre
src/components/product/SortSelect.tsx
```

Mobilde filtreler `Modal` (sheet varyantı) içinde sunulmalı — masaüstünde
yan panel. `Modal` bileşeni mobilde zaten alttan sheet olarak açılıyor.

## Recommended Backend Implementation

**Aşama 1 — filtre + sıralama (düşük maliyet, yüksek fayda):**

```python
if min_price is not None:
    query = query.filter(Product.price >= min_price)
if max_price is not None:
    query = query.filter(Product.price <= max_price)

order = {
    "newest": Product.created_at.desc(),
    "price_asc": Product.price.asc(),
    "price_desc": Product.price.desc(),
}.get(sort, Product.created_at.desc())
query = query.order_by(order)
```

**Aşama 2 — full-text search (ilan sayısı ~10k'yı geçince):**

```sql
ALTER TABLE products ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title,  '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(story,  '')), 'B')
  ) STORED;

CREATE INDEX products_search_idx ON products USING GIN (search_vector);
```

> PostgreSQL'in yerleşik Türkçe sözlüğü yoktur. `'simple'` yapılandırması
> kök bulma (stemming) yapmaz ama aksan/dil sorunları çıkarmaz — pratikte
> ILIKE'dan çok daha hızlı ve yeterlidir. Türkçe stemming gerekirse
> `zemberek` tabanlı özel bir sözlük veya harici arama motoru (Meilisearch,
> Typesense) değerlendirilmelidir.

## Security Considerations

1. **SQL enjeksiyonu:** SQLAlchemy parametreli sorgu kullanıyor — mevcut kod
   güvenli. Full-text'e geçerken ham SQL yazılırsa bu korunmalı.
2. **DoS:** Çok uzun `q` değeri pahalı sorgu üretebilir; sunucu tarafında
   uzunluk sınırı (örn. 100 karakter) konulmalı.
3. **Rate limiting:** Autocomplete her tuş vuruşunda tetiklenebilir; debounce
   istemci tarafında var ama sunucu tarafı sınır da gerekir.
4. **Sızıntı:** `draft`/`paused`/silinmiş ilanlar sonuçlara girmemeli.

## Dependencies

- Aşama 1: yok (mevcut sorguya ekleme)
- Aşama 2: migration (`search_vector` + GIN indeksi)
- İsteğe bağlı: Meilisearch / Typesense
