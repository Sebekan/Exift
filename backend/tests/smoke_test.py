import json, os, random, sys, urllib.error, urllib.parse, urllib.request, uuid

BASE = os.environ.get("EXIFT_API_URL", "http://localhost:8000")
passed, failed = [], []

def call(method, path, body=None, token=None, expect=None):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Accept", "application/json")
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, data) as r:
            status, payload = r.status, (json.loads(r.read() or b"null"))
    except urllib.error.HTTPError as e:
        status, payload = e.code, json.loads(e.read() or b"null")
    return status, payload

def check(name, cond, detail=""):
    (passed if cond else failed).append(name)
    print(("  PASS  " if cond else "  FAIL  ") + name + (f"   [{detail}]" if detail and not cond else ""))

sfx = uuid.uuid4().hex[:8]


def unique_phone() -> str:
    """Her koşuda benzersiz, geçerli bir TR cep numarası (+90 53X XXX XX XX)."""
    return f"+9053{random.randint(10_000_000, 99_999_999)}"


ALICE_PHONE = unique_phone()
BOB_PHONE = unique_phone()

print("\n== 1. REGISTER (telefon zorunlu ve KAYDEDİLİYOR) ==")
s, alice = call("POST", "/api/auth/register", {
    "nickname": f"alice{sfx}", "email": f"alice{sfx}@test.com",
    "password": "sifre123", "phone": ALICE_PHONE})
check("register 201", s == 201, f"{s} {alice}")
atok = alice.get("access_token")
if not atok:
    print(f"\n  DURDURULDU: kayıt başarısız oldu -> {alice}")
    sys.exit(1)
check("register telefonu döner", alice.get("user", {}).get("phone") == ALICE_PHONE,
      f"phone={alice.get('user',{}).get('phone')}")

print("\n== 2. REGISTER doğrulama ==")
s, r = call("POST", "/api/auth/register", {
    "nickname": f"bob{sfx}", "email": f"bob{sfx}@test.com", "password": "sifre123", "phone": "1234"})
check("geçersiz telefon 400", s == 400, f"{s} {r}")
s, r = call("POST", "/api/auth/register", {
    "nickname": f"alice{sfx}", "email": f"other{sfx}@test.com", "password": "sifre123", "phone": unique_phone()})
check("nickname çakışması 400", s == 400, f"{s} {r}")
s, r = call("POST", "/api/auth/register", {
    "nickname": f"dup{sfx}", "email": f"alice{sfx}@test.com", "password": "sifre123", "phone": unique_phone()})
check("e-posta çakışması 400", s == 400, f"{s} {r}")

print("\n== 3. LOGIN + oturum ==")
s, r = call("POST", "/api/auth/login", {"email": f"ALICE{sfx}@test.com", "password": "sifre123"})
check("login büyük/küçük harf duyarsız", s == 200, f"{s} {r}")
s, r = call("POST", "/api/auth/login", {"email": f"alice{sfx}@test.com", "password": "yanlis"})
check("yanlış şifre 401", s == 401, f"{s}")
s, r = call("GET", "/api/auth/me", token=atok)
check("GET /me 200", s == 200 and r.get("phone"), f"{s} {r}")
s, r = call("GET", "/api/auth/me", token="bozuk-token")
check("bozuk token 401 (500 DEĞİL)", s == 401, f"{s} {r}")

print("\n== 4. İLAN OLUŞTURMA + doğrulama ==")
s, prod = call("POST", "/api/products/", {
    "title": "Test Yüzüğü", "story": "x"*60, "price": 500,
    "category": "taki-aksesuar", "district": "Kadıköy",
    "images": ["https://res.cloudinary.com/demo/image/upload/a.jpg"]}, token=atok)
check("ilan oluşturma 201", s == 201, f"{s} {prod}")
pid = prod.get("id")
check("seller.id dönüyor (sahiplik için)", bool(prod.get("seller", {}).get("id")))
s, r = call("POST", "/api/products/", {
    "title": "X", "story": "y"*60, "price": 5, "category": "teknoloji",
    "district": "Kadıköy", "images": []}, token=atok)
check("kısa başlık 400", s == 400, f"{s} {r}")
s, r = call("POST", "/api/products/", {
    "title": "Data URI testi", "story": "y"*60, "price": 5, "category": "teknoloji",
    "district": "Kadıköy", "images": ["data:image/png;base64," + "A"*600]}, token=atok)
check("base64 data URI 400 (500 DEĞİL)", s == 400, f"{s} {r}")

print("\n== 5. SAHİPLİK: başkasının ilanı ==")
s, bob = call("POST", "/api/auth/register", {
    "nickname": f"bob{sfx}", "email": f"bob{sfx}@test.com",
    "password": "sifre123", "phone": BOB_PHONE})
btok = bob.get("access_token")
check("ikinci kullanıcı kaydı", s == 201, f"{s} {bob}")
s, r = call("PUT", f"/api/products/{pid}", {"title": "Ele geçirildi"}, token=btok)
check("başkasının ilanını düzenleme 403", s == 403, f"{s} {r}")
s, r = call("DELETE", f"/api/products/{pid}", token=btok)
check("başkasının ilanını silme 403", s == 403, f"{s} {r}")
s, r = call("PUT", f"/api/products/{pid}", {"title": "Ele geçirildi"})
check("token'sız düzenleme 401", s == 401, f"{s}")

print("\n== 6. SAHİP: düzenleme ==")
s, r = call("PUT", f"/api/products/{pid}", {"title": "Güncellenmiş Yüzük", "price": 750}, token=atok)
check("sahip düzenleyebiliyor", s == 200 and r.get("title") == "Güncellenmiş Yüzük", f"{s} {r}")
check("fiyat güncellendi", r.get("price") == 750.0, f"{r.get('price')}")

print("\n== 7. /mine ve favoriler ==")
s, mine = call("GET", "/api/products/mine", token=atok)
check("/mine sahibin ilanlarını döner", s == 200 and any(p["id"] == pid for p in mine), f"{s}")
s, mine_b = call("GET", "/api/products/mine", token=btok)
check("/mine başkasınınkini sızdırmaz", s == 200 and not any(p["id"] == pid for p in mine_b), f"{s}")
s, r = call("POST", f"/api/products/{pid}/favorite", token=btok)
check("favori ekleme", s == 200 and r.get("favorited") is True, f"{s} {r}")
s, favs = call("GET", "/api/products/favorites", token=btok)
check("favoriler listesi", s == 200 and any(p["id"] == pid for p in favs), f"{s}")

print("\n== 8. YORUMLAR (author_id / is_mine) ==")
s, c = call("POST", f"/api/products/{pid}/comments", {"text": "Çok güzel bir hikaye"}, token=btok)
check("yorum ekleme 201", s == 201, f"{s} {c}")
cid = c.get("id")
s, comments = call("GET", f"/api/products/{pid}/comments", token=btok)
check("yorum author_id içeriyor", s == 200 and comments and comments[0].get("author_id"), f"{s}")
check("kendi yorumunda is_mine=True", comments[0].get("is_mine") is True)
s, comments_a = call("GET", f"/api/products/{pid}/comments", token=atok)
check("başkasının yorumunda is_mine=False", comments_a[0].get("is_mine") is False)
s, r = call("DELETE", f"/api/comments/{cid}", token=atok)
check("başkasının yorumunu silme 403", s == 403, f"{s} {r}")

print("\n== 9. SOHBET (ilan bağlamı + is_seller) ==")
s, chat = call("POST", f"/api/chats/contact/{pid}", token=btok)
check("sohbet açma 200", s == 200, f"{s} {chat}")
chat_id = chat.get("id")
check("sohbet ürün fiyatı taşıyor", chat.get("product_price") == 750.0, f"{chat.get('product_price')}")
check("alıcı için is_seller=False", chat.get("is_seller") is False)
check("alıcıya karşı taraf=satıcı", chat.get("other_party_nickname") == f"alice{sfx}",
      f"{chat.get('other_party_nickname')}")
s, chats_a = call("GET", "/api/chats/", token=atok)
check("satıcı için is_seller=True", chats_a and chats_a[0].get("is_seller") is True)
check("satıcıya karşı taraf=alıcı", chats_a and chats_a[0].get("other_party_nickname") == f"bob{sfx}",
      f"{chats_a[0].get('other_party_nickname') if chats_a else None}")
s, r = call("POST", f"/api/chats/contact/{pid}", token=atok)
check("kendi ilanıyla sohbet 400", s == 400, f"{s} {r}")
s, r = call("POST", f"/api/chats/{chat_id}/messages", {"text": "Merhaba"}, token=btok)
check("mesaj gönderme 201", s == 201, f"{s} {r}")

print("\n== 10. PROFİL GÜNCELLEME (avatar + telefon) ==")
s, r = call("PUT", "/api/auth/me", {
    "bio": "Yeni biyografi",
    "avatar_url": "https://res.cloudinary.com/demo/image/upload/av.jpg"}, token=atok)
check("avatar_url kaydediliyor", s == 200 and r.get("avatar_url", "").endswith("av.jpg"), f"{s} {r}")
check("bio kaydediliyor", r.get("bio") == "Yeni biyografi")
s, r = call("PUT", "/api/auth/me", {"phone": BOB_PHONE}, token=atok)
check("başkasının telefonu 400", s == 400, f"{s} {r}")

print("\n== 11. SİLME (FK cascade — 500 olmamalı) ==")
# İlanın favorisi, yorumu, sohbeti ve mesajı var; hepsi temizlenmeli.
s, r = call("DELETE", f"/api/products/{pid}", token=atok)
check("bağımlı kayıtlı ilan silme 204 (500 DEĞİL)", s == 204, f"{s} {r}")
s, r = call("GET", f"/api/products/{pid}")
check("silinen ilan 404", s == 404, f"{s}")
s, favs = call("GET", "/api/products/favorites", token=btok)
check("favori de temizlendi", not any(p["id"] == pid for p in favs))

print("\n== 12. FİLTRELER (fiyat aralığı + sıralama + joker kaçırma) ==")
s, f1 = call("POST", "/api/products/", {
    "title": "Filtre testi ucuz", "story": "z"*60, "price": 100,
    "category": "teknoloji", "district": "Kadıköy",
    "images": ["https://res.cloudinary.com/demo/image/upload/f1.jpg"]}, token=atok)
s, f2 = call("POST", "/api/products/", {
    "title": "Filtre testi pahali", "story": "z"*60, "price": 9000,
    "category": "teknoloji", "district": "Beşiktaş",
    "images": ["https://res.cloudinary.com/demo/image/upload/f2.jpg"]}, token=atok)
fid1, fid2 = f1.get("id"), f2.get("id")

s, r = call("GET", "/api/products/?min_price=8000")
check("min_price filtreliyor", s == 200 and all(p["price"] >= 8000 for p in r["items"]), f"{s}")
s, r = call("GET", "/api/products/?max_price=150")
check("max_price filtreliyor", s == 200 and all(p["price"] <= 150 for p in r["items"]), f"{s}")
s, r = call("GET", "/api/products/?min_price=9000&max_price=100")
check("ters aralık 400", s == 400, f"{s} {r}")

s, r = call("GET", "/api/products/?sort=price_asc&limit=100")
prices = [p["price"] for p in r["items"]]
check("price_asc artan sıralı", s == 200 and prices == sorted(prices), f"{prices[:5]}")
s, r = call("GET", "/api/products/?sort=price_desc&limit=100")
prices = [p["price"] for p in r["items"]]
check("price_desc azalan sıralı", s == 200 and prices == sorted(prices, reverse=True), f"{prices[:5]}")
s, r = call("GET", "/api/products/?sort=gecersiz")
check("geçersiz sort 422", s == 422, f"{s}")

# ILIKE joker kaçırma: "%" tüm tabloyu DÖNDÜRMEMELİ
s, all_r = call("GET", "/api/products/")
s, r = call("GET", "/api/products/?q=%25")
check("ILIKE '%' kaçırılıyor (tüm tabloyu döndürmüyor)",
      s == 200 and r["total"] < all_r["total"], f"q=%: {r.get('total')} / toplam: {all_r.get('total')}")
s, r = call("GET", "/api/products/?q=_")
check("ILIKE '_' kaçırılıyor", s == 200 and r["total"] < all_r["total"], f"{r.get('total')}")

s, r = call("GET", "/api/products/?category=teknoloji&district=" + urllib.parse.quote("Beşiktaş"))
check("kategori+konum birlikte filtreliyor",
      s == 200 and all(p["category"] == "teknoloji" and p["district"] == "Beşiktaş" for p in r["items"]), f"{s}")

for fid in (fid1, fid2):
    if fid: call("DELETE", f"/api/products/{fid}", token=atok)
check("filtre testi ilanları temizlendi", True)

print("\n" + "="*54)
print(f"  TOPLAM: {len(passed)} geçti, {len(failed)} başarısız")
if failed:
    print("  BAŞARISIZ:")
    for f in failed: print("   -", f)
print("="*54)
sys.exit(1 if failed else 0)
