/**
 * Fiyat biçimlendirme. Sayı olmayan değerlerde çökmez — eksik/bozuk bir API
 * alanı tüm sayfayı düşürmemeli.
 */
export function formatPrice(price: number | null | undefined): string {
  const value = typeof price === "number" && Number.isFinite(price) ? price : 0;
  return `${value.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Yakın tarihler için "3 saat önce", eskiler için tam tarih.
 * Pazar yerlerinde tazelik önemli bir sinyal olduğu için kartlarda bu kullanılır.
 */
export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return "az önce";
  if (diffMinutes < 60) return `${diffMinutes} dk önce`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} saat önce`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "dün";
  if (diffDays < 7) return `${diffDays} gün önce`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;

  return formatDate(iso);
}

/** Sohbet listesinde kullanılır: bugünse saat, değilse kısa tarih. */
export function formatChatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return formatTime(iso);

  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays < 7) return date.toLocaleDateString("tr-TR", { weekday: "short" });

  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

/**
 * Kart önizlemesinde hikâyeyi ilk birkaç kelimeyle keser — tam metin ilan
 * detayında görünür. Amaç kartı sadeleştirmek ve merak uyandırmak (Threads'teki
 * kesik gönderi önizlemesi gibi).
 */
export function truncateWords(text: string, wordCount: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= wordCount) return words.join(" ");
  return `${words.slice(0, wordCount).join(" ")}…`;
}

/** Mesaj balonlarını gün gün ayırmak için başlık. */
export function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}
