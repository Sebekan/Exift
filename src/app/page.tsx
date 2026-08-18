"use client";

import { Suspense, useCallback } from "react";
import { SlidersHorizontal } from "lucide-react";
import { listingService } from "@/services";
import { filtersKey, toQuery } from "@/lib/filters";
import { useListingFilters } from "@/hooks/useListingFilters";
import { usePaginatedListings } from "@/hooks/usePaginatedListings";
import { Container } from "@/components/layout/Container";
import { HeroSection } from "@/components/product/HeroSection";
import { MostTalkedSection } from "@/components/product/MostTalkedSection";
import { ActiveFilters } from "@/components/product/ActiveFilters";
import { FilterBar } from "@/components/product/FilterBar";
import { FilterPanel } from "@/components/product/FilterPanel";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { ErrorState, ProductGridSkeleton } from "@/components/ui/States";

const PAGE_SIZE = 24;

function HomeContent() {
  const { filters, chips, activeCount, hasActive, setFilters, removeChip, clearAll, setSort } =
    useListingFilters();

  const query = toQuery(filters);
  const key = filtersKey(filters);

  const fetchPage = useCallback(
    (page: number, signal: AbortSignal) =>
      listingService.list({ ...query, page, limit: PAGE_SIZE }, signal),
    // `key` filtrelerin kararlı özetidir; nesne kimliği her render değişir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  const { items, total, loading, loadingMore, error, hasMore, loadMore, reload } =
    usePaginatedListings(fetchPage, key);

  return (
    <Container className="pt-6 pb-24">
      <HeroSection />

      {/* Etkileşim sinyali yoksa ve filtre uygulanmışsa bu bölüm gürültüdür. */}
      {!hasActive && <MostTalkedSection products={items} />}

      <div id="ilanlar" className="scroll-mt-24">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="font-heading text-[21px] font-extrabold tracking-[-0.5px] text-text-main sm:text-[24px]">
            {hasActive ? "Filtrelenmiş İlanlar" : "Satışa Çıkan Anılar"}
          </h1>
          {!loading && !error && (
            <span className="text-[13px] font-semibold text-text-muted tabular-nums">
              {total} ilan
            </span>
          )}
        </div>

        <div className="mb-4">
          <FilterBar
            filters={filters}
            activeCount={activeCount}
            onChange={setFilters}
            onClear={clearAll}
            onSortChange={setSort}
            resultCount={total}
            loading={loading}
          />
        </div>

        <ActiveFilters chips={chips} onRemove={removeChip} onClearAll={clearAll} />

        <div className="flex gap-8">
          {/* Masaüstünde kalıcı yan panel; mobilde drawer (FilterBar içinde). */}
          <aside className="hidden w-[260px] shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-border bg-bg-card p-5 shadow-card">
              <h2 className="mb-5 flex items-center gap-2 border-b border-border pb-3 font-heading text-[14px] font-bold text-text-main">
                <SlidersHorizontal size={15} className="text-primary" aria-hidden />
                Filtrele
              </h2>
              <FilterPanel filters={filters} onChange={setFilters} onClear={clearAll} />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {error && items.length === 0 ? (
              <ErrorState
                message={error}
                onRetry={reload}
                offline={error.includes("bağlantı")}
              />
            ) : (
              <>
                <ProductGrid
                  products={items}
                  loading={loading}
                  columns="responsive"
                  emptyTitle={hasActive ? "Sonuç bulunamadı" : "Henüz ilan yok"}
                  emptyMessage={
                    hasActive
                      ? "Bu filtrelere uygun ilan yok. Filtreleri gevşetmeyi ya da temizlemeyi dene."
                      : "İlk anıyı sen paylaş ve pazar yerini başlat."
                  }
                  emptyActionLabel={hasActive ? "Filtreleri Temizle" : "İlan Ver"}
                  emptyActionHref={hasActive ? undefined : "/ilan-ver"}
                  onEmptyAction={hasActive ? clearAll : undefined}
                />

                {loadingMore && (
                  <div className="mt-6">
                    <ProductGridSkeleton count={3} />
                  </div>
                )}

                {hasMore && !loadingMore && (
                  <div className="mt-10 flex justify-center">
                    <Button variant="secondary" size="lg" onClick={loadMore}>
                      Daha Fazla Göster
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <Container className="pt-6 pb-24">
          <ProductGridSkeleton />
        </Container>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
