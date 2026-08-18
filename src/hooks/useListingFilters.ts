"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildSearchParams,
  clearFilters,
  countActiveFilters,
  parseFilters,
  removeFilter,
  toChips,
  type FilterChip,
  type ListingFilters,
  type SortOption,
} from "@/lib/filters";

export interface UseListingFilters {
  filters: ListingFilters;
  chips: FilterChip[];
  activeCount: number;
  hasActive: boolean;
  /** Birden çok alanı tek seferde günceller (drawer'da "Uygula"). */
  setFilters: (next: Partial<ListingFilters>) => void;
  /** Tek bir chip'i kaldırır. */
  removeChip: (key: FilterChip["key"]) => void;
  clearAll: () => void;
  setSort: (sort: SortOption) => void;
}

/**
 * Filtre state'ini URL'e bağlar.
 *
 * State burada TUTULMAZ; her render URL'den okunur. Bu sayede:
 *  - Geri/İleri tuşları ek kod olmadan doğru çalışır.
 *  - Adres çubuğundan elle silinen parametre anında UI'a yansır.
 *  - "UI'da temizlenmiş ama arka planda duran" filtre durumu oluşamaz.
 *
 * Gezinme `replace` ile yapılır: her filtre değişikliği geçmişe yeni bir kayıt
 * eklerse, geri tuşu kullanıcıyı filtreler arasında tek tek gezdirir ve
 * sayfadan çıkması zorlaşır.
 */
export function useListingFilters(): UseListingFilters {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // useSearchParams salt okunur bir görünüm döner; kopyalayıp kullanıyoruz.
  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);
  const filters = useMemo(() => parseFilters(params), [params]);

  const apply = useCallback(
    (next: ListingFilters) => {
      const query = buildSearchParams(next, params).toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, params],
  );

  const setFilters = useCallback(
    (partial: Partial<ListingFilters>) => apply({ ...filters, ...partial }),
    [apply, filters],
  );

  const removeChip = useCallback(
    (key: FilterChip["key"]) => apply(removeFilter(filters, key)),
    [apply, filters],
  );

  const clearAll = useCallback(() => apply(clearFilters(filters)), [apply, filters]);

  const setSort = useCallback((sort: SortOption) => apply({ ...filters, sort }), [apply, filters]);

  const chips = useMemo(() => toChips(filters), [filters]);
  const activeCount = countActiveFilters(filters);

  return {
    filters,
    chips,
    activeCount,
    hasActive: activeCount > 0,
    setFilters,
    removeChip,
    clearAll,
    setSort,
  };
}
