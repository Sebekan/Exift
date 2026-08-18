"use client";

import { X } from "lucide-react";
import type { FilterChip } from "@/lib/filters";

/**
 * Aktif filtrelerin görünür özeti.
 *
 * Bu bileşen ürünün "silinemeyen filtre" sorununa karşı asıl güvencesidir:
 * bir filtre uygulandığı anda ekranda kaldırılabilir bir chip olarak belirir —
 * hangi kırılım noktasında olursa olsun (mobil/masaüstü fark etmez).
 */
export function ActiveFilters({
  chips,
  onRemove,
  onClearAll,
}: {
  chips: FilterChip[];
  onRemove: (key: FilterChip["key"]) => void;
  onClearAll: () => void;
}) {
  if (chips.length === 0) return null;

  return (
    <div
      className="animate-fade-in mb-4 flex flex-wrap items-center gap-2"
      role="region"
      aria-label="Aktif filtreler"
    >
      <span className="text-[12px] font-bold text-text-secondary">Aktif filtreler:</span>

      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex max-w-[240px] items-center gap-1 rounded-full border border-primary/30 bg-primary-light py-1 pr-1 pl-3 text-[12.5px] font-semibold text-primary"
        >
          <span className="truncate">{chip.label}</span>
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            /* Dokunma hedefi 28px: chip küçük ama × kolay tıklanabilir olmalı. */
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-primary hover:text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label={`${chip.label} filtresini kaldır`}
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </span>
      ))}

      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="rounded-full px-3 py-1.5 text-[12.5px] font-bold text-text-secondary underline underline-offset-2 transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          Tümünü Temizle
        </button>
      )}
    </div>
  );
}
