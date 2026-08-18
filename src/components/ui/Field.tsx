"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Ortak sarmalayıcı                                                   */
/* ------------------------------------------------------------------ */

interface FieldShellProps {
  id: string;
  label?: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  /** Sağ üstte gösterilen sayaç, "12/200" gibi. */
  counter?: string;
  children: ReactNode;
}

function FieldShell({ id, label, error, hint, required, counter, children }: FieldShellProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="w-full">
      {(label || counter) && (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          {label && (
            <label htmlFor={id} className="font-heading text-[13px] font-bold text-text-main">
              {label}
              {required && (
                <span className="ml-1 text-primary" aria-hidden>
                  *
                </span>
              )}
            </label>
          )}
          {counter && (
            <span className="shrink-0 text-[11px] font-medium text-text-muted tabular-nums">
              {counter}
            </span>
          )}
        </div>
      )}

      {children}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-[12px] font-semibold text-red-600"
        >
          <AlertCircle size={13} className="mt-px shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-[12px] text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Girdi kutularının ortak görünümü — Input/Select/Textarea aynı dili konuşur. */
const CONTROL_BASE =
  "w-full rounded-2xl border bg-bg-body px-4 text-[14px] text-text-main " +
  "transition-[border-color,box-shadow,background-color] duration-200 outline-none " +
  "placeholder:text-text-muted " +
  "focus:bg-bg-card focus:ring-4 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const CONTROL_OK = "border-border focus:border-primary focus:ring-primary-light";
const CONTROL_ERROR = "border-red-400 focus:border-red-500 focus:ring-red-500/10";

function controlClass(hasError: boolean, extra?: string) {
  return cn(CONTROL_BASE, hasError ? CONTROL_ERROR : CONTROL_OK, extra);
}

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: string;
  error?: string | null;
  hint?: string;
  counter?: string;
  leftIcon?: ReactNode;
  /** Şifre göster/gizle gibi sağ taraf aksiyonu. */
  rightSlot?: ReactNode;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, counter, leftIcon, rightSlot, className, id, required, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hasError = Boolean(error);

  return (
    <FieldShell
      id={fieldId}
      label={label}
      error={error}
      hint={hint}
      required={required}
      counter={counter}
    >
      <div className="relative">
        {leftIcon && (
          <span
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-muted"
            aria-hidden
          >
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={controlClass(
            hasError,
            cn("h-12", Boolean(leftIcon) && "pl-11", Boolean(rightSlot) && "pr-12", className),
          )}
          {...rest}
        />
        {rightSlot && (
          <span className="absolute top-1/2 right-2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
    </FieldShell>
  );
});

/* ------------------------------------------------------------------ */
/* Textarea                                                            */
/* ------------------------------------------------------------------ */

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  label?: string;
  error?: string | null;
  hint?: string;
  counter?: string;
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, counter, className, id, required, rows = 4, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hasError = Boolean(error);

  return (
    <FieldShell
      id={fieldId}
      label={label}
      error={error}
      hint={hint}
      required={required}
      counter={counter}
    >
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={controlClass(hasError, cn("resize-y py-3 leading-relaxed", className))}
        {...rest}
      />
    </FieldShell>
  );
});

/* ------------------------------------------------------------------ */
/* Select                                                              */
/* ------------------------------------------------------------------ */

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  label?: string;
  error?: string | null;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, className, id, required, children, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hasError = Boolean(error);

  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} required={required}>
      <select
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={controlClass(hasError, cn("h-12 appearance-none pr-10", className))}
        style={{
          // Native ok yerine tema ile uyumlu chevron.
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237a5568' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 14px center",
        }}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});
