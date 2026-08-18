"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { categories } from "@/lib/categories";
import { getCategoryIcon } from "@/lib/icons";
import { EMPTY_FILTERS, type ListingFilters } from "@/lib/filters";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import districts from "@/data/districts.json";

export interface FilterPanelProps {
  filters: ListingFilters;
  /** Anında uygulanır (masaüstü) veya taslak olarak biriktirilir (mobil drawer). */
  onChange: (next: Partial<ListingFilters>) => void;
  onClear: () => void;
  /** Mobil drawer'da butonlar drawer'ın altındadır. */
  showActions?: boolean;
}

/**
 * Filtre alanları. Masaüstünde yan panel, mobilde drawer içinde kullanılır —
 * aynı bileşen, iki yerleşim. Bu, iki filtre arayüzünün zamanla birbirinden
 * ayrışmasını engeller.
 */
export function FilterPanel({ filters, onChange, onClear, showActions = true }: FilterPanelProps) {
  // Fiyat girdisi yazarken her tuşta URL güncellemesin; blur/Enter'da uygulanır.
  const [minDraft, setMinDraft] = useState(filters.minPrice?.toString() ?? "");
  const [maxDraft, setMaxDraft] = useState(filters.maxPrice?.toString() ?? "");

  // URL dışarıdan değişirse (chip kaldırma, geri tuşu) taslakları eşitle.
  const priceKey = `${filters.minPrice ?? ""}|${filters.maxPrice ?? ""}`;
  const syncedKey = useMemo(() => priceKey, [priceKey]);
  const [lastKey, setLastKey] = useState(syncedKey);
  if (lastKey !== syncedKey) {
    setLastKey(syncedKey);
    setMinDraft(filters.minPrice?.toString() ?? "");
    setMaxDraft(filters.maxPrice?.toString() ?? "");
  }

  function commitPrice() {
    const min = minDraft.trim() === "" ? null : Math.max(0, Number(minDraft));
    const max = maxDraft.trim() === "" ? null : Math.max(0, Number(maxDraft));

    const validMin = min !== null && Number.isFinite(min) ? min : null;
    const validMax = max !== null && Number.isFinite(max) ? max : null;

    // Kullanıcı ters aralık girdiyse sessizce düzelt — hata göstermeye gerek yok.
    if (validMin !== null && validMax !== null && validMin > validMax) {
      onChange({ minPrice: validMax, maxPrice: validMin });
      return;
    }
    onChange({ minPrice: validMin, maxPrice: validMax });
  }

  const isDirty = JSON.stringify({ ...filters, sort: null }) !== JSON.stringify({ ...EMPTY_FILTERS, sort: null });

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-3 font-heading text-[13px] font-bold text-text-main">Kategori</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.icon);
            const isActive = filters.category === category.id;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  // Aktif kategoriye tekrar basmak filtreyi kaldırır.
                  onChange({ category: isActive ? null : category.id })
                }
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-2 font-heading text-[12.5px] font-semibold",
                  "transition-[background-color,border-color,color] duration-200",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-bg-body text-text-secondary hover:border-primary hover:text-primary",
                )}
              >
                <Icon size={13} aria-hidden /> {category.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Select
        label="Konum"
        value={filters.district ?? ""}
        onChange={(e) => onChange({ district: e.target.value || null })}
      >
        <option value="">Tüm ilçeler</option>
        {(districts as string[]).map((district) => (
          <option key={district} value={district}>
            {district}
          </option>
        ))}
      </Select>

      <fieldset>
        <legend className="mb-2 font-heading text-[13px] font-bold text-text-main">
          Fiyat aralığı (₺)
        </legend>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="En az"
            aria-label="En düşük fiyat"
            value={minDraft}
            onChange={(e) => setMinDraft(e.target.value)}
            onBlur={commitPrice}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitPrice();
              }
            }}
          />
          <span className="pt-0.5 text-text-muted" aria-hidden>
            —
          </span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="En çok"
            aria-label="En yüksek fiyat"
            value={maxDraft}
            onChange={(e) => setMaxDraft(e.target.value)}
            onBlur={commitPrice}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitPrice();
              }
            }}
          />
        </div>
      </fieldset>

      {showActions && isDirty && (
        <Button
          variant="secondary"
          onClick={onClear}
          leftIcon={<RotateCcw size={14} />}
          fullWidth
        >
          Filtreleri Temizle
        </Button>
      )}
    </div>
  );
}
