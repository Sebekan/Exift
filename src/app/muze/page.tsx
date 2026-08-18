"use client";

import { useCallback } from "react";
import { listingService } from "@/services";
import { usePaginatedListings } from "@/hooks/usePaginatedListings";
import { Container } from "@/components/layout/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { ErrorState, ProductGridSkeleton } from "@/components/ui/States";

const PAGE_SIZE = 24;

export default function MuseumPage() {
  const fetchPage = useCallback(
    (page: number, signal: AbortSignal) => listingService.listMuseum(page, PAGE_SIZE, signal),
    [],
  );

  const { items, loading, loadingMore, error, hasMore, loadMore, reload } = usePaginatedListings(
    fetchPage,
    "museum",
  );

  return (
    <div className="bg-[radial-gradient(ellipse_at_top,rgba(201,168,119,0.08),transparent_60%)]">
      <Container className="animate-rise-in pt-10 pb-24">
        <header className="mb-10 flex flex-col items-center text-center">
          <span className="mb-2 font-serif text-[11px] font-semibold tracking-[0.35em] text-[#a67c3d] uppercase">
            Exift Arşivi &middot; Est. 2026
          </span>
          <h1 className="font-display text-[36px] leading-none font-bold tracking-[-0.5px] text-text-main italic sm:text-[40px]">
            Exift Müzesi
          </h1>
          <div className="my-4 flex items-center gap-3" aria-hidden>
            <span className="h-px w-14 bg-[#c9a877]/60" />
            <span className="h-1.5 w-1.5 rotate-45 border border-[#c9a877]" />
            <span className="h-px w-14 bg-[#c9a877]/60" />
          </div>
          <p className="max-w-[520px] font-serif text-[14.5px] leading-relaxed text-text-secondary italic">
            Satılan tüm ürünler ve yüklerinden arınan kalplerin silinmeyen anı hikayeleri burada
            yaşamaya devam ediyor.
          </p>
        </header>

        <div className="relative border border-[#c9a877]/30 p-4 sm:p-6 md:p-10">
          <span className="absolute top-0 left-0 h-6 w-6 border-t-2 border-l-2 border-[#c9a877]" aria-hidden />
          <span className="absolute top-0 right-0 h-6 w-6 border-t-2 border-r-2 border-[#c9a877]" aria-hidden />
          <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-[#c9a877]" aria-hidden />
          <span className="absolute right-0 bottom-0 h-6 w-6 border-r-2 border-b-2 border-[#c9a877]" aria-hidden />

          {error && items.length === 0 ? (
            <ErrorState message={error} onRetry={reload} />
          ) : (
            <>
              <ProductGrid
                products={items}
                loading={loading}
                cardVariant="museum"
                emptyTitle="Müze henüz boş"
                emptyMessage="Satılan ilk anı arşivlendiğinde burada sergilenecek."
              />

              {loadingMore && (
                <div className="mt-6">
                  <ProductGridSkeleton count={3} />
                </div>
              )}

              {hasMore && !loadingMore && (
                <div className="mt-10 flex justify-center">
                  <Button variant="secondary" size="lg" onClick={loadMore}>
                    Daha Fazla Eser Göster
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
