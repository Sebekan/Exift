"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StepperProps {
  steps: string[];
  /** 0 tabanlı aktif adım. */
  current: number;
  /** Tamamlanmış adıma tıklayarak geri dönülebilir. */
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, current, onStepClick }: StepperProps) {
  return (
    <ol className="flex items-start" aria-label="İlan oluşturma adımları">
      {steps.map((label, index) => {
        const isDone = index < current;
        const isActive = index === current;
        const canNavigate = isDone && onStepClick;

        return (
          <li
            // Tüm adımlar eşit genişlikte olmalı: ilki dar bırakılırsa bir
            // sonraki adımın `left-[-50%]` bağlayıcısı ilk dairenin soluna
            // taşar ve havada duran bir çizgi görünür.
            key={label}
            className="relative flex flex-1 flex-col items-center"
            aria-current={isActive ? "step" : undefined}
          >
            {/* Bağlayıcı çizgi — ilk adımın solunda çizgi olmaz. */}
            {index > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-[17px] right-1/2 left-[-50%] h-[3px] transition-colors duration-300",
                  isDone || isActive ? "bg-primary" : "bg-border",
                )}
              />
            )}

            <button
              type="button"
              onClick={canNavigate ? () => onStepClick(index) : undefined}
              disabled={!canNavigate}
              className={cn(
                "relative z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full border-[3px] border-bg-card",
                "font-heading text-[13px] font-bold transition-colors duration-300",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
                canNavigate && "cursor-pointer hover:opacity-85",
                isDone || isActive ? "bg-primary text-white" : "bg-border text-text-muted",
              )}
              aria-label={canNavigate ? `${label} adımına dön` : label}
            >
              {isDone ? <Check size={16} strokeWidth={3} aria-hidden /> : index + 1}
            </button>

            <span
              className={cn(
                "mt-1.5 max-w-[110px] text-center font-heading text-[11px] font-semibold transition-colors",
                isDone || isActive ? "text-text-main" : "text-text-muted",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
