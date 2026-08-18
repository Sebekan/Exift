"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { useResettableState } from "@/hooks/useResettableState";

/**
 * İlan görsel galerisi. Tek görselde oklar ve küçük resimler gizlenir;
 * çoklu görselde klavye (←/→) ile gezinilebilir.
 */
export function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const usable = images.filter(Boolean);
  const hasMultiple = usable.length > 1;

  // Görsel listesi değişirse (düzenleme sonrası) seçim ilk kareye döner.
  const galleryKey = usable.join("|");
  const [index, setIndex] = useResettableState(galleryKey, useCallback(() => 0, []));
  const [failed, setFailed] = useState<Set<number>>(new Set());

  function go(direction: -1 | 1) {
    setIndex((current) => (current + direction + usable.length) % usable.length);
  }

  if (usable.length === 0) {
    return (
      <div className="flex h-[320px] w-full items-center justify-center rounded-3xl border border-border bg-bg-body md:h-[520px]">
        <div className="flex flex-col items-center gap-2 text-text-muted">
          <ImageOff size={30} aria-hidden />
          <span className="text-[13px] font-semibold">Görsel yok</span>
        </div>
      </div>
    );
  }

  const currentFailed = failed.has(index);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="group relative h-[320px] w-full overflow-hidden rounded-3xl border border-border bg-black shadow-card md:h-[520px]"
        role={hasMultiple ? "group" : undefined}
        aria-roledescription={hasMultiple ? "galeri" : undefined}
        tabIndex={hasMultiple ? 0 : -1}
        onKeyDown={(e) => {
          if (!hasMultiple) return;
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(-1);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            go(1);
          }
        }}
      >
        {currentFailed ? (
          <div className="flex h-full w-full items-center justify-center bg-bg-body">
            <ImageOff size={30} className="text-text-muted" aria-hidden />
          </div>
        ) : (
          <Image
            key={usable[index]}
            src={usable[index]}
            alt={hasMultiple ? `${title} — görsel ${index + 1}/${usable.length}` : title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            onError={() => setFailed((prev) => new Set(prev).add(index))}
            className="image-fade-in object-contain"
          />
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Önceki görsel"
              className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none max-md:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Sonraki görsel"
              className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none max-md:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
            <span className="absolute right-3 bottom-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm tabular-nums">
              {index + 1} / {usable.length}
            </span>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {usable.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Görsel ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                i === index
                  ? "border-primary opacity-100"
                  : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              {failed.has(i) ? (
                <span className="flex h-full w-full items-center justify-center bg-bg-body">
                  <ImageOff size={14} className="text-text-muted" aria-hidden />
                </span>
              ) : (
                <Image src={src} alt="" fill sizes="64px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
