"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ImageOff, MessageCircle, TrendingUp } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/format";

export function MostTalkedSection({ products }: { products: Product[] }) {
  const mostTalked = useMemo(
    () =>
      [...products]
        // Yorum ağırlıklı bir popülerlik sinyali: konuşma, beğeniden değerli.
        .sort((a, b) => b.commentsCount * 2 + b.likes - (a.commentsCount * 2 + a.likes))
        .slice(0, 3),
    [products],
  );

  // Etkileşim yoksa bölüm gürültüden ibaret olur.
  if (mostTalked.length === 0 || mostTalked.every((p) => p.commentsCount + p.likes === 0)) {
    return null;
  }

  return (
    <section className="mb-9 rounded-3xl border border-border bg-bg-card p-5 shadow-card sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-heading text-sm font-extrabold tracking-wide text-text-secondary uppercase">
        <TrendingUp size={16} className="text-primary" aria-hidden /> Öne Çıkanlar
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mostTalked.map((product) => (
          <Link
            key={product.id}
            href={`/ilan/${product.id}`}
            className="flex items-center gap-3 rounded-2xl border border-border p-3 transition-[border-color,transform] duration-200 hover:-translate-y-px hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-reduce:hover:translate-y-0"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-border">
              {product.imageUrl ? (
                <Image src={product.imageUrl} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <ImageOff size={15} className="text-text-muted" aria-hidden />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-text-main">{product.title}</p>
              <p className="mt-0.5 flex items-center gap-2.5 text-[11px] text-text-muted">
                <span className="flex items-center gap-1">
                  <MessageCircle size={11} aria-hidden /> {product.commentsCount}
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={11} aria-hidden /> {product.likes}
                </span>
              </p>
              <p className="mt-0.5 text-[11.5px] font-semibold text-primary">
                {formatPrice(product.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
