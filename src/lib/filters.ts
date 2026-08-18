import type { CategoryId } from "@/types";
import { categories } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import districts from "@/data/districts.json";

/**
 * Filtre sözleşmesi.
 *
 * TEK DOĞRULUK KAYNAĞI URL'dir. Filtreler localStorage/sessionStorage veya
 * global state'te TUTULMAZ — bu bilinçli bir karardır:
 *
 *  - Kullanıcı filtreli bir listeyi paylaşabilir/yer imine ekleyebilir.
 *  - Geri/İleri tuşları tarayıcının kendi geçmişiyle doğal çalışır.
 *  - "Silinemeyen filtre" durumu yapısal olarak imkânsızdır: chip'i kaldırmak
 *    query parametresini kaldırmak demektir, gizli bir kopya kalmaz.
 */

export type SortOption = "newest" | "oldest" | "price_asc" | "price_desc";

export const DEFAULT_SORT: SortOption = "newest";

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "En Yeni",
  oldest: "En Eski",
  price_asc: "Fiyat: Düşükten Yükseğe",
  price_desc: "Fiyat: Yüksekten Düşüğe",
};

export const SORT_OPTIONS = Object.keys(SORT_LABELS) as SortOption[];

export interface ListingFilters {
  q: string;
  category: CategoryId | null;
  district: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortOption;
}

export const EMPTY_FILTERS: ListingFilters = {
  q: "",
  category: null,
  district: null,
  minPrice: null,
  maxPrice: null,
  sort: DEFAULT_SORT,
};

/** URL'de filtreye ait olan parametreler — temizleme bunlarla sınırlıdır. */
export const FILTER_PARAM_KEYS = [
  "q",
  "kategori",
  "konum",
  "minFiyat",
  "maxFiyat",
  "sirala",
] as const;

const CATEGORY_IDS = new Set(categories.map((c) => c.id));
const DISTRICT_SET = new Set(districts as string[]);
const SORT_SET = new Set(SORT_OPTIONS);

function parsePrice(raw: string | null): number | null {
  if (!raw) return null;
  const value = Number(raw);
  // Negatif/NaN/sonsuz değerler yok sayılır — bozuk URL uygulamayı kırmamalı.
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

/**
 * URL parametrelerini filtre nesnesine çevirir. Geçersiz değerler sessizce
 * düşer; elle düzenlenmiş bir adres uygulamayı bozamaz.
 */
export function parseFilters(params: URLSearchParams): ListingFilters {
  const category = params.get("kategori");
  const district = params.get("konum");
  const sort = params.get("sirala");

  return {
    q: params.get("q")?.slice(0, 100) ?? "",
    category: category && CATEGORY_IDS.has(category as CategoryId) ? (category as CategoryId) : null,
    district: district && DISTRICT_SET.has(district) ? district : null,
    minPrice: parsePrice(params.get("minFiyat")),
    maxPrice: parsePrice(params.get("maxFiyat")),
    sort: sort && SORT_SET.has(sort as SortOption) ? (sort as SortOption) : DEFAULT_SORT,
  };
}

/**
 * Filtreleri query string'e çevirir. Varsayılan/boş değerler YAZILMAZ —
 * böylece temiz bir liste `/` adresinde kalır, `?sirala=newest` gibi gürültü
 * birikmez.
 */
export function buildSearchParams(
  filters: ListingFilters,
  extra?: URLSearchParams,
): URLSearchParams {
  // Filtre dışı parametreler (varsa) korunur.
  const params = new URLSearchParams();
  if (extra) {
    extra.forEach((value, key) => {
      if (!FILTER_PARAM_KEYS.includes(key as (typeof FILTER_PARAM_KEYS)[number])) {
        params.set(key, value);
      }
    });
  }

  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.category) params.set("kategori", filters.category);
  if (filters.district) params.set("konum", filters.district);
  if (filters.minPrice !== null) params.set("minFiyat", String(filters.minPrice));
  if (filters.maxPrice !== null) params.set("maxFiyat", String(filters.maxPrice));
  if (filters.sort !== DEFAULT_SORT) params.set("sirala", filters.sort);

  return params;
}

/** Sıralama bir filtre değildir — "aktif filtre" sayımına dahil edilmez. */
export function countActiveFilters(filters: ListingFilters): number {
  let count = 0;
  if (filters.q.trim()) count++;
  if (filters.category) count++;
  if (filters.district) count++;
  if (filters.minPrice !== null || filters.maxPrice !== null) count++;
  return count;
}

export function hasActiveFilters(filters: ListingFilters): boolean {
  return countActiveFilters(filters) > 0;
}

/** Chip olarak gösterilecek her aktif filtre. */
export interface FilterChip {
  /** Kaldırma işleminin hedefi. */
  key: "q" | "category" | "district" | "price";
  label: string;
}

export function toChips(filters: ListingFilters): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.q.trim()) {
    chips.push({ key: "q", label: `"${filters.q.trim()}"` });
  }
  if (filters.category) {
    const label = categories.find((c) => c.id === filters.category)?.label ?? filters.category;
    chips.push({ key: "category", label });
  }
  if (filters.district) {
    chips.push({ key: "district", label: filters.district });
  }
  if (filters.minPrice !== null || filters.maxPrice !== null) {
    const min = filters.minPrice;
    const max = filters.maxPrice;
    const label =
      min !== null && max !== null
        ? `${formatPrice(min)} - ${formatPrice(max)}`
        : min !== null
          ? `${formatPrice(min)} ve üzeri`
          : `${formatPrice(max as number)} ve altı`;
    chips.push({ key: "price", label });
  }

  return chips;
}

/** Bir chip'i kaldırılmış yeni filtre nesnesi döner. */
export function removeFilter(filters: ListingFilters, key: FilterChip["key"]): ListingFilters {
  switch (key) {
    case "q":
      return { ...filters, q: "" };
    case "category":
      return { ...filters, category: null };
    case "district":
      return { ...filters, district: null };
    case "price":
      // Fiyat tek bir chip olarak sunulur; kaldırma iki ucu birden temizler.
      return { ...filters, minPrice: null, maxPrice: null };
  }
}

/** Sıralama korunur — kullanıcı "Tümünü Temizle" derken sıralamayı kastetmiyor. */
export function clearFilters(filters: ListingFilters): ListingFilters {
  return { ...EMPTY_FILTERS, sort: filters.sort };
}

/** Servis katmanına gidecek sorgu — sunucu adları (snake_case). */
export function toQuery(filters: ListingFilters) {
  return {
    q: filters.q.trim() || undefined,
    category: filters.category ?? undefined,
    district: filters.district ?? undefined,
    minPrice: filters.minPrice ?? undefined,
    maxPrice: filters.maxPrice ?? undefined,
    sort: filters.sort,
  };
}

/** Aynı filtrelerde gereksiz yeniden çekmeyi önleyen kararlı anahtar. */
export function filtersKey(filters: ListingFilters): string {
  return [
    filters.q.trim(),
    filters.category ?? "",
    filters.district ?? "",
    filters.minPrice ?? "",
    filters.maxPrice ?? "",
    filters.sort,
  ].join("|");
}
