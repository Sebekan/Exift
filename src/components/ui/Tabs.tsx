"use client";

import { useRef, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  /** Sekme etiketinin yanında gösterilen sayı. */
  count?: number;
}

export interface TabsProps<T extends string> {
  items: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

/**
 * WAI-ARIA tabs deseni: ok tuşlarıyla gezinme, Home/End desteği ve yalnızca
 * aktif sekmenin tab sırasında olması.
 */
export function Tabs<T extends string>({ items, active, onChange, className }: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(event: React.KeyboardEvent) {
    const currentIndex = items.findIndex((i) => i.id === active);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % items.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + items.length) % items.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = items.length - 1;

    if (nextIndex === null) return;
    event.preventDefault();
    onChange(items[nextIndex].id);
    listRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [nextIndex]?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn(
        "no-scrollbar relative flex gap-1 overflow-x-auto border-b-2 border-border",
        className,
      )}
    >
      {items.map(({ id, label, icon: Icon, count }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={isActive}
            aria-controls={`panel-${id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(id)}
            className={cn(
              "-mb-0.5 flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 font-heading text-[13px] font-semibold whitespace-nowrap",
              "transition-colors duration-200 focus-visible:rounded-t-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-main",
            )}
          >
            {Icon && <Icon size={14} aria-hidden />}
            {label}
            {typeof count === "number" && (
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums",
                  isActive ? "bg-primary text-white" : "bg-border text-text-secondary",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel<T extends string>({
  id,
  active,
  children,
}: {
  id: T;
  active: T;
  children: ReactNode;
}) {
  if (id !== active) return null;
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className="animate-fade-in focus-visible:outline-none"
    >
      {children}
    </div>
  );
}
