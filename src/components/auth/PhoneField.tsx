"use client";

import { useId } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { COUNTRIES, formatNationalDisplay, type Country } from "@/lib/phone";

export interface PhoneFieldProps {
  country: Country;
  onCountryChange: (country: Country) => void;
  value: string;
  onValueChange: (value: string) => void;
  error?: string | null;
  onBlur?: () => void;
  disabled?: boolean;
}

/**
 * Ülke kodu ayrı seçilir, numara ayrı girilir; gönderimde E.164'e birleştirilir.
 * (Backend `phonenumbers` ile aynı biçimi bekliyor.)
 */
export function PhoneField({
  country,
  onCountryChange,
  value,
  onValueChange,
  error,
  onBlur,
  disabled,
}: PhoneFieldProps) {
  const inputId = useId();
  const selectId = useId();
  const errorId = `${inputId}-error`;
  const hasError = Boolean(error);

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-2 block font-heading text-[13px] font-bold text-text-main">
        Telefon numarası
        <span className="ml-1.5 text-[11px] font-medium text-text-muted">(isteğe bağlı)</span>
      </label>

      <div
        className={cn(
          "flex items-stretch overflow-hidden rounded-2xl border bg-bg-body transition-[border-color,box-shadow] duration-200",
          "focus-within:bg-bg-card focus-within:ring-4",
          hasError
            ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-500/10"
            : "border-border focus-within:border-primary focus-within:ring-primary-light",
        )}
      >
        <label htmlFor={selectId} className="sr-only">
          Ülke kodu
        </label>
        <select
          id={selectId}
          value={country.dial}
          disabled={disabled}
          onChange={(e) => {
            const next = COUNTRIES.find((c) => c.dial === e.target.value);
            if (next) onCountryChange(next);
          }}
          className="h-12 shrink-0 cursor-pointer appearance-none border-r border-border bg-transparent pr-2 pl-4 text-[14px] font-semibold text-text-main outline-none disabled:opacity-60"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.dial}>
              {c.flag} {c.dial}
            </option>
          ))}
        </select>

        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={country.placeholder}
          value={formatNationalDisplay(value, country)}
          disabled={disabled}
          onChange={(e) => onValueChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className="h-12 w-full min-w-0 bg-transparent px-4 text-[14px] text-text-main outline-none placeholder:text-text-muted disabled:opacity-60"
        />
      </div>

      {hasError ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-[12px] font-semibold text-red-600"
        >
          <AlertCircle size={13} className="mt-px shrink-0" aria-hidden />
          {error}
        </p>
      ) : (
        <p className="mt-1.5 text-[12px] text-text-muted">
          Alıcılarla iletişim için kullanılır, ilanında görünmez.
        </p>
      )}
    </div>
  );
}
