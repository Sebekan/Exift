"use client";

import { PackageOpen } from "lucide-react";
import type { Product } from "@/types";
import { cn } from "@/lib/cn";
import { ProductCard } from "./ProductCard";
import { EmptyState, ProductGridSkeleton } from "@/components/ui/States";

export interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  onEmptyAction?: () => void;
  cardVariant?: "default" | "museum";
  showOwnerActions?: boolean;
  /** `responsive`: yan panelin yanında dar, tam genişlikte 4 sütuna çıkar. */
  columns?: "default" | "responsive";
  className?: string;
}

const COLUMN_CLASSES = {
  default: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  responsive: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
} as const;

export function ProductGrid({
  products,
  loading = false,
  emptyTitle = "Sonuç bulunamadı",
  emptyMessage = "Bu kriterlere uygun ilan bulunamadı. Filtreleri değiştirmeyi dene.",
  emptyActionLabel,
  emptyActionHref,
  onEmptyAction,
  cardVariant = "default",
  showOwnerActions = false,
  columns = "default",
  className,
}: ProductGridProps) {
  if (loading) return <ProductGridSkeleton />;

  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title={emptyTitle}
        description={emptyMessage}
        actionLabel={emptyActionLabel}
        actionHref={emptyActionHref}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div
      className={cn(
        "stagger-children grid gap-5 lg:gap-6",
        COLUMN_CLASSES[columns],
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          variant={cardVariant}
          exhibitNo={index + 1}
          showOwnerActions={showOwnerActions}
          // İlk satır LCP'ye girer; öncelikli yüklensin.
          priority={index < 3}
        />
      ))}
    </div>
  );
}
