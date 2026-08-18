"use client";

import { useCallback, useMemo, useState } from "react";
import { toUserMessage } from "@/lib/api/errors";
import type { ListingPage } from "@/services";
import type { Product } from "@/types";
import { useAsyncData } from "./useAsyncData";

export interface PaginatedListings {
  items: Product[];
  total: number;
  /** İlk sayfa yükleniyor. */
  loading: boolean;
  /** "Daha fazla" ile sonraki sayfa yükleniyor. */
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
}

/**
 * Sayfalı ilan listesi. İlk sayfa `filterKey` değiştiğinde otomatik çekilir;
 * sonraki sayfalar yalnızca kullanıcı "Daha fazla" dediğinde eklenir.
 *
 * Biriktirme, effect içinde değil `loadMore`'un async akışında yapılır —
 * böylece filtre değişimi ile sayfa ekleme birbirine karışmaz.
 */
export function usePaginatedListings(
  fetchPage: (page: number, signal: AbortSignal) => Promise<ListingPage>,
  filterKey: string,
): PaginatedListings {
  const firstPageFetcher = useCallback(
    (signal: AbortSignal) => fetchPage(1, signal),
    [fetchPage],
  );
  const { data: firstPage, loading, error, reload } =
    useAsyncData<ListingPage>(firstPageFetcher);

  // Ek sayfalar filtreye bağlıdır; filtre değişince render sırasında düşer.
  const [extra, setExtra] = useState<{ key: string; items: Product[]; page: number } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const activeExtra = extra?.key === filterKey ? extra : null;

  const items = useMemo(() => {
    const base = firstPage?.items ?? [];
    if (!activeExtra) return base;
    // Sunucu tarafında araya yeni ilan girmişse aynı id iki kez gelebilir.
    const seen = new Set(base.map((p) => p.id));
    return [...base, ...activeExtra.items.filter((p) => !seen.has(p.id))];
  }, [firstPage, activeExtra]);

  const currentPage = activeExtra?.page ?? 1;
  const hasMore = firstPage ? currentPage < firstPage.pages : false;

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = currentPage + 1;

    setLoadingMore(true);
    try {
      const result = await fetchPage(nextPage, new AbortController().signal);
      setExtra((current) => {
        const previous = current?.key === filterKey ? current.items : [];
        return { key: filterKey, items: [...previous, ...result.items], page: nextPage };
      });
    } catch {
      // Sessiz: mevcut liste ekranda kalır, kullanıcı tekrar deneyebilir.
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, filterKey, currentPage, hasMore, loadingMore]);

  return {
    items,
    total: firstPage?.total ?? 0,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    reload,
  };
}

/** Servis hatalarını kullanıcı mesajına çeviren yardımcı (dışa aktarım kolaylığı). */
export { toUserMessage };
