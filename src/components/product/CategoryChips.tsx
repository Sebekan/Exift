"use client";

import { Shapes } from "lucide-react";
import { categories } from "@/lib/categories";
import { getCategoryIcon } from "@/lib/icons";
import type { CategoryId } from "@/types";

export function CategoryChips({
  active,
  onChange,
}: {
  active: CategoryId | "all";
  onChange: (id: CategoryId | "all") => void;
}) {
  return (
    <div className="no-scrollbar mb-4 flex gap-3 overflow-x-auto pt-1 pb-4">
      <button
        onClick={() => onChange("all")}
        className={`flex shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 font-heading text-[13px] font-semibold whitespace-nowrap shadow-card transition-all ${
          active === "all"
            ? "border-primary bg-primary text-white shadow-[0_4px_12px_rgba(214,33,98,0.18)]"
            : "border-border bg-bg-card text-text-secondary hover:-translate-y-px hover:border-primary hover:text-primary"
        }`}
      >
        <Shapes size={14} /> Tümü
      </button>
      {categories.map((category) => {
        const Icon = getCategoryIcon(category.icon);
        const isActive = active === category.id;
        return (
          <button
            key={category.id}
            onClick={() => onChange(category.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 font-heading text-[13px] font-semibold whitespace-nowrap shadow-card transition-all ${
              isActive
                ? "border-primary bg-primary text-white shadow-[0_4px_12px_rgba(214,33,98,0.18)]"
                : "border-border bg-bg-card text-text-secondary hover:-translate-y-px hover:border-primary hover:text-primary"
            }`}
          >
            <Icon size={14} /> {category.label}
          </button>
        );
      })}
    </div>
  );
}
