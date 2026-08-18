"use client";

import { useCallback } from "react";
import type { Product } from "@/types";
import { listingService } from "@/services";
import { useAsyncData } from "@/hooks/useAsyncData";
import { Container } from "@/components/layout/Container";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ErrorState } from "@/components/ui/States";

function SandikContent() {
  const fetcher = useCallback((signal: AbortSignal) => listingService.listFavorites(signal), []);
  const { data, loading, error, reload } = useAsyncData<Product[]>(fetcher);

  return (
    <Container className="animate-rise-in pt-10 pb-24">
      <header className="mb-10 flex flex-col items-center text-center">
        <h1 className="font-display text-[36px] leading-none font-bold tracking-[-0.5px] text-text-main italic sm:text-[40px]">
          Exift Sandığı
        </h1>
        <div className="my-4 flex items-center gap-3" aria-hidden>
          <span className="h-px w-14 bg-primary/30" />
          <span className="h-1.5 w-1.5 rotate-45 border border-primary/50" />
          <span className="h-px w-14 bg-primary/30" />
        </div>
        <p className="max-w-[520px] font-serif text-[14.5px] leading-relaxed text-text-secondary italic">
          Beğendiğin ve daha sonra dönmek için kaydettiğin anılar.
        </p>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <ProductGrid
          products={data ?? []}
          loading={loading}
          emptyTitle="Sandığın henüz boş"
          emptyMessage="Kalbine dokunan bir anı bulduğunda kaydet ikonuna dokun; burada seni beklesin."
          emptyActionLabel="İlanlara Göz At"
          emptyActionHref="/"
        />
      )}
    </Container>
  );
}

export default function SandikPage() {
  return (
    <RequireAuth message="Sandığını görmek için hesabına giriş yapmalısın.">
      <SandikContent />
    </RequireAuth>
  );
}
