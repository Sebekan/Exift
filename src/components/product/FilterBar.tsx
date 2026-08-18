"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpDown, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { SORT_LABELS, SORT_OPTIONS, type ListingFilters, type SortOption } from "@/lib/filters";
import { useDebounced } from "@/hooks/useDebounced";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FilterPanel } from "./FilterPanel";

export interface FilterBarProps {
  filters: ListingFilters;
  activeCount: number;
  onChange: (next: Partial<ListingFilters>) => void;
  onClear: () => void;
  onSortChange: (sort: SortOption) => void;
  resultCount?: number;
  loading?: boolean;
}

/**
 * Liste üstündeki filtre şeridi: arama, sıralama ve mobil filtre girişi.
 *
 * Arama kutusu HER kırılımda görünür. Önceki sürümde masaüstünde `md:hidden`
 * ile gizliydi; aktif bir arama uygulandığında kullanıcının onu temizlemek
 * için hiçbir arayüzü kalmıyordu — filtre "silinemez" hâle geliyordu.
 */
export function FilterBar({
  filters,
  activeCount,
  onChange,
  onClear,
  onSortChange,
  resultCount,
  loading = false,
}: FilterBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  /*
   * Arama kutusu iki yönlü çalışır:
   *   yazarken  → yerel taslak anında güncellenir (girdi takılmasın),
   *               450ms sonra URL'e yazılır
   *   dışarıdan → chip kaldırma / geri tuşu / "Tümünü Temizle" URL'i
   *               değiştirdiğinde taslak ona eşitlenir
   *
   * URL yazma işlemi MUTLAKA effect içinde yapılır. Render sırasında
   * `router.replace` çağırmak React'in "Cannot update a component (Router)
   * while rendering a different component" hatasını ve ardından sonsuz
   * render döngüsünü tetikler.
   */
  const [draft, setDraft] = useState(filters.q);
  // Taslağın en son eşitlendiği URL değeri. Bundan farklı bir `filters.q`
  // görürsek değişiklik dışarıdan gelmiştir (chip, geri tuşu, "Tümünü Temizle").
  const [syncedTo, setSyncedTo] = useState(filters.q);

  if (filters.q !== syncedTo) {
    // Aynı bileşende, render sırasında state ayarlama — React'in "prop
    // değişince state'i güncelle" için önerdiği desen. Farklı bir bileşeni
    // (Router) güncellemediği için güvenli.
    setSyncedTo(filters.q);
    // Kullanıcının yazdığı değere eşitse dokunma: imleç sona atlamasın.
    if (filters.q !== draft.trim()) setDraft(filters.q);
  }

  const debounced = useDebounced(draft, 450);

  // `onChange` her render'da yeni referans; effect bağımlılığı olmamalı.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  /*
   * Bu effect'in bağımlılığında `filters.q` da var çünkü karşılaştırma için
   * güncel değeri okuması gerekiyor — ama SADECE `debounced` gerçekten
   * değiştiğinde URL'e yazmalı. `filters.q` harici bir sebeple değiştiğinde
   * (Enter'a basmak, chip kaldırma, geri tuşu) bu effect deps değiştiği için
   * yine de çalışır; `debounced` o anda henüz kullanıcının son yazdığına
   * yetişmemiş (450ms'lik zamanlayıcı hâlâ bekliyor) olabilir. Bu durumda
   * `prevDebounced` kontrolü olmadan, henüz güncellenmemiş eski `debounced`
   * değeri URL'e geri yazılır ve az önce uygulanan filtreyi anında siler.
   * Örnek: yazıp hemen Enter'a basmak — submit senkron olarak "polaroid"
   * uygular, ardından bu effect `filters.q` değişimiyle tekrar çalışır ama
   * `debounced` henüz "" olduğundan aramayı geri temizler.
   */
  const prevDebouncedRef = useRef(debounced);
  useEffect(() => {
    const debounceSettled = prevDebouncedRef.current !== debounced;
    prevDebouncedRef.current = debounced;
    if (!debounceSettled) return;

    const next = debounced.trim();
    if (next === filters.q.trim()) return;
    onChangeRef.current({ q: next });
  }, [debounced, filters.q]);

  function submit(event: FormEvent) {
    event.preventDefault();
    onChange({ q: draft.trim() });
  }

  function clearSearch() {
    setDraft("");
    onChange({ q: "" });
  }

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <form onSubmit={submit} role="search" className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-muted"
            size={17}
            aria-hidden
          />
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="İlan veya hikâye ara..."
            aria-label="İlan ara"
            className="h-12 w-full rounded-full border border-border bg-bg-card pr-11 pl-11 text-[14px] font-medium text-text-main shadow-card transition-[border-color,box-shadow] outline-none focus:border-primary focus:ring-4 focus:ring-primary-light"
          />
          {draft && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Aramayı temizle"
              className="absolute top-1/2 right-2.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-body hover:text-text-main focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <X size={15} />
            </button>
          )}
        </form>

        <div className="flex shrink-0 items-center gap-2">
          {/* Mobil/tablet: filtreler drawer'da. */}
          <Button
            variant="secondary"
            onClick={() => setDrawerOpen(true)}
            leftIcon={<SlidersHorizontal size={15} />}
            className="flex-1 rounded-full lg:hidden"
          >
            Filtrele
            {activeCount > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white tabular-nums">
                {activeCount}
              </span>
            )}
          </Button>

          <div className="relative flex-1 lg:flex-none">
            <ArrowUpDown
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted"
              size={14}
              aria-hidden
            />
            <select
              value={filters.sort}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="Sıralama"
              className={cn(
                "h-12 w-full cursor-pointer appearance-none rounded-full border border-border bg-bg-card pr-9 pl-10",
                "text-[13px] font-semibold text-text-main shadow-card transition-[border-color,box-shadow] outline-none",
                "focus:border-primary focus:ring-4 focus:ring-primary-light lg:w-[230px]",
              )}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237a5568' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobil filtre drawer'ı — Modal mobilde alttan sheet olarak açılır. */}
      <Modal
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filtrele"
        description={
          typeof resultCount === "number" && !loading
            ? `${resultCount} ilan bulundu`
            : undefined
        }
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                onClear();
                setDrawerOpen(false);
              }}
              className="sm:min-w-[130px]"
            >
              Temizle
            </Button>
            <Button onClick={() => setDrawerOpen(false)} className="sm:min-w-[170px]">
              Sonuçları Göster
            </Button>
          </>
        }
      >
        {/* Aksiyonlar drawer'ın altında olduğu için panel kendi butonunu göstermez. */}
        <FilterPanel filters={filters} onChange={onChange} onClear={onClear} showActions={false} />
      </Modal>
    </>
  );
}
