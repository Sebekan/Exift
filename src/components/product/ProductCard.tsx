"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart, ImageOff, MapPin, MessageCircle, Pencil } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice, formatRelativeDate, truncateWords } from "@/lib/format";
import { getCategoryLabel } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { isProductOwner } from "@/lib/ownership";
import { useAppData } from "@/context/AppDataContext";
import { useAuthGate } from "@/context/AuthGateContext";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/Badge";

export interface ProductCardProps {
  product: Product;
  variant?: "default" | "museum";
  exhibitNo?: number;
  /** Sahibine "Düzenle" kısayolu göster (profil > ilanlarım). */
  showOwnerActions?: boolean;
  priority?: boolean;
}

function ImageFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex h-full w-full items-center justify-center bg-border/60", className)}
      aria-hidden
    >
      <ImageOff size={24} className="text-text-muted" />
    </div>
  );
}

export function ProductCard({
  product,
  variant = "default",
  exhibitNo,
  showOwnerActions = false,
  priority = false,
}: ProductCardProps) {
  const { isFavorite, toggleFavorite, isLiked, toggleLike, isAuthenticated, profile } = useAppData();
  const { requestSoftGate } = useAuthGate();
  const { showToast } = useToast();

  const [likeCount, setLikeCount] = useState(product.likes);
  const [imageFailed, setImageFailed] = useState(false);
  // Kalp/yer imi animasyonunu yalnızca kullanıcı tetiklediğinde oynat.
  const [pulse, setPulse] = useState<"like" | "save" | null>(null);

  const favorite = isFavorite(product.id);
  const liked = isLiked(product.id);
  const owner = isProductOwner(product, profile);
  const isMuseum = variant === "museum";

  async function handleLike(event: React.MouseEvent) {
    // Kart bir <Link>; aksiyon tıklaması gezinmeyi tetiklemesin.
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) return requestSoftGate("like");

    setPulse("like");
    const result = await toggleLike(product.id);
    if (result) setLikeCount(result.likesCount);
  }

  async function handleSave(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) return requestSoftGate("save");

    setPulse("save");
    const nowFavorited = await toggleFavorite(product.id);
    if (nowFavorited === null) return;
    showToast(
      nowFavorited ? "Sandığına eklendi" : "Sandıktan çıkarıldı",
      nowFavorited ? "success" : "neutral",
    );
  }

  const actionButtons = (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        onClick={handleLike}
        aria-label={liked ? "Beğeniyi geri al" : "Beğen"}
        aria-pressed={liked}
        className={cn(
          "flex h-[34px] w-[34px] items-center justify-center rounded-full backdrop-blur-sm transition-transform duration-200",
          "hover:scale-[1.1] active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          "motion-reduce:transition-none motion-reduce:hover:scale-100",
          isMuseum
            ? "border border-[#e8d5a8]/50 bg-black/45"
            : "border border-border bg-bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
        )}
      >
        <Heart
          size={18}
          onAnimationEnd={() => setPulse(null)}
          className={cn(
            liked
              ? "fill-red-500 text-red-500"
              : isMuseum
                ? "text-[#f3e6c8]"
                : "text-text-secondary",
            pulse === "like" && "animate-pop",
          )}
        />
      </button>
      <button
        onClick={handleSave}
        aria-label={favorite ? "Sandıktan çıkar" : "Sandığa ekle"}
        aria-pressed={favorite}
        className={cn(
          "flex h-[34px] w-[34px] items-center justify-center rounded-full backdrop-blur-sm transition-transform duration-200",
          "hover:scale-[1.1] active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          "motion-reduce:transition-none motion-reduce:hover:scale-100",
          isMuseum
            ? "border border-[#e8d5a8]/50 bg-black/45"
            : "border border-border bg-bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
        )}
      >
        <Bookmark
          size={15}
          onAnimationEnd={() => setPulse(null)}
          className={cn(
            favorite
              ? isMuseum
                ? "fill-[#e8d5a8] text-[#e8d5a8]"
                : "fill-primary text-primary"
              : isMuseum
                ? "text-[#f3e6c8]"
                : "text-text-secondary",
            pulse === "save" && "animate-pop",
          )}
        />
      </button>
    </div>
  );

  /* ------------------------------- Müze ------------------------------- */

  if (isMuseum) {
    return (
      <Link
        href={`/ilan/${product.id}`}
        className="group relative flex flex-col overflow-hidden rounded-sm border border-[#c9a877]/40 bg-bg-card shadow-card transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-hover focus-visible:ring-2 focus-visible:ring-[#c9a877] focus-visible:outline-none motion-reduce:hover:translate-y-0"
      >
        <div className="relative h-[220px] w-full overflow-hidden bg-border">
          {product.imageUrl && !imageFailed ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImageFailed(true)}
              className="object-cover grayscale-[85%] contrast-[1.02] sepia-[.25] transition-all duration-700 group-hover:scale-[1.03] group-hover:grayscale-0 group-hover:sepia-0"
            />
          ) : (
            <ImageFallback />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          <div className="absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col items-start gap-1">
              <span className="flex max-w-full items-center gap-1.5 rounded-sm border border-[#e8d5a8]/60 bg-black/55 py-1 pr-2.5 pl-1 font-serif text-[11px] tracking-[0.08em] text-[#f3e6c8] backdrop-blur-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c9a877]/80 text-[10px] font-bold text-black">
                  {product.seller.nickname.charAt(0).toUpperCase() || "E"}
                </span>
                <span className="truncate">{product.seller.nickname}</span>
              </span>
              {typeof exhibitNo === "number" && (
                <span className="rounded-sm border border-[#e8d5a8]/70 bg-black/55 px-2.5 py-1 font-serif text-[11px] tracking-[0.12em] text-[#f3e6c8] backdrop-blur-sm">
                  Eser No. {String(exhibitNo).padStart(3, "0")}
                </span>
              )}
            </div>
            {actionButtons}
          </div>

          <span className="absolute bottom-3 left-3 z-10 rounded-sm border border-[#e8d5a8]/60 bg-black/55 px-2.5 py-1 font-serif text-[10px] tracking-[0.12em] text-[#f3e6c8] uppercase backdrop-blur-sm">
            {getCategoryLabel(product.category)}
          </span>
        </div>

        <div className="flex flex-1 flex-col border-t border-[#c9a877]/30 p-5">
          <h3 className="mb-1.5 font-display text-[20px] leading-tight font-semibold tracking-[-0.2px] text-text-main">
            {product.title}
          </h3>
          <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tracking-wide text-text-muted italic">
            <span className="flex items-center gap-1">
              <MapPin size={11} aria-hidden /> {product.district}
            </span>
            {product.soldDate && <span>&middot; Arşivlendi: {formatRelativeDate(product.soldDate)}</span>}
          </div>
          <p className="mb-4 line-clamp-3 border-l-[3px] border-[#c9a877] bg-[#c9a877]/10 px-3 py-2.5 font-serif text-[13.5px] leading-relaxed text-text-main italic">
            {product.story}
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-dashed border-[#c9a877]/40 pt-3">
            <span className="font-display text-lg font-bold text-[#a67c3d]">
              {formatPrice(product.price)}
            </span>
            <div className="flex items-center gap-2.5 text-[11px] tracking-wide text-text-muted italic">
              <span className="flex items-center gap-1">
                <MessageCircle size={12} aria-hidden /> {product.commentsCount}
              </span>
              <span className="flex items-center gap-1">
                <Heart size={12} className={cn(liked && "fill-red-400 text-red-400")} aria-hidden />{" "}
                {likeCount}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  /* ------------------------------ Standart ----------------------------- */

  return (
    <Link
      href={`/ilan/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-card shadow-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative h-[200px] w-full overflow-hidden bg-border">
        {product.imageUrl && !imageFailed ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImageFailed(true)}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <ImageFallback />
        )}
        <div className="absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-black/55 to-transparent" />

        <div className="absolute inset-x-2.5 top-2.5 z-20 flex items-center justify-between gap-2">
          {/* Güven sinyali olarak kalsın ama geri planda: küçük avatar, soluk metin. */}
          <span className="flex min-w-0 items-center gap-1 rounded-full bg-black/25 py-0.5 pr-2 pl-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/90 text-[8px] font-bold text-white">
              {product.seller.nickname.charAt(0).toUpperCase() || "E"}
            </span>
            <span className="truncate">{owner ? "İlanın" : product.seller.nickname}</span>
          </span>
          {owner ? (
            showOwnerActions && !product.sold ? (
              <span
                className="flex h-[34px] items-center gap-1.5 rounded-full border border-border bg-bg-card px-3 text-[11.5px] font-bold text-primary shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                aria-hidden
              >
                <Pencil size={12} /> Düzenle
              </span>
            ) : null
          ) : (
            actionButtons
          )}
        </div>

        <span className="absolute bottom-[15px] left-[15px] z-10 rounded-md bg-primary/85 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm">
          {getCategoryLabel(product.category)}
        </span>
        {product.sold && (
          <span className="absolute right-[12px] bottom-[15px] z-10 rounded-full bg-red-500/90 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            Satıldı
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* Konum yalnızca ilan detayında görünür — kartta merak uyandırmaz, ilgi çekerse ilana girince görülür. */}
        <div className="mb-2 flex items-center justify-end">
          <span className="text-[10px] font-normal text-text-muted/70">
            {formatRelativeDate(product.createdAt)}
          </span>
        </div>

        <h3 className="mb-2 line-clamp-2 font-heading text-[17px] leading-tight font-bold tracking-[-0.3px] text-text-main">
          {product.title}
        </h3>

        {/* Hikâyenin tamamı yalnızca ilan detayında: kartta ilk birkaç kelime merak uyandırsın. */}
        <p className="mb-3.5 line-clamp-1 rounded-r-lg border-l-[3px] border-primary bg-primary-light px-3 py-2.5 font-serif text-[13.5px] leading-relaxed text-text-main italic">
          {truncateWords(product.story, 5)}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="font-heading text-lg font-extrabold text-primary">
            {formatPrice(product.price)}
          </span>
          <div className="flex shrink-0 items-center gap-3 text-[11.5px] font-semibold text-text-muted">
            <span className="flex items-center gap-1">
              <MessageCircle size={13} aria-hidden /> {product.commentsCount}
            </span>
            <span className="flex items-center gap-1">
              <Heart size={16} className={cn(liked && "fill-red-500 text-red-500")} aria-hidden />{" "}
              {likeCount}
            </span>
          </div>
        </div>

        {showOwnerActions && owner && product.sold && (
          <Badge tone="neutral" className="mt-3 self-start">
            {product.museumStatus === "approved"
              ? "Müzede arşivlendi"
              : product.museumStatus === "pending"
                ? "Müze onayı bekleniyor"
                : "Satıldı"}
          </Badge>
        )}

        {showOwnerActions && owner && !product.sold && !product.isPublished && (
          <Badge tone="neutral" className="mt-3 self-start">
            Yayından kaldırıldı
          </Badge>
        )}
      </div>
    </Link>
  );
}
