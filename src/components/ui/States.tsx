"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Loader2, RefreshCw, WifiOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, ButtonLink } from "./Button";

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-shimmer rounded-xl bg-border/70", className)}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-bg-card shadow-card">
      <Skeleton className="h-[200px] w-full rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-14 w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

export function LoadingState({ message = "Yükleniyor..." }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-20 text-text-secondary"
    >
      <Loader2 size={26} className="animate-spin text-primary" aria-hidden />
      <p className="text-[13.5px] font-semibold">{message}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty                                                               */
/* ------------------------------------------------------------------ */

export interface EmptyStateProps {
  icon?: LucideIcon | (() => ReactNode);
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-bg-card px-6 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary">
          <Icon size={26} aria-hidden />
        </div>
      )}
      <h3 className="mb-2 font-heading text-[17px] font-extrabold text-text-main">{title}</h3>
      {description && (
        <p className="mb-6 max-w-[420px] text-[13.5px] leading-relaxed text-text-secondary">
          {description}
        </p>
      )}
      {actionLabel && actionHref && <ButtonLink href={actionHref}>{actionLabel}</ButtonLink>}
      {actionLabel && !actionHref && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Error                                                               */
/* ------------------------------------------------------------------ */

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  /** Ağ hatasında farklı bir ikon göster. */
  offline?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Bir şeyler ters gitti",
  message,
  onRetry,
  retrying = false,
  offline = false,
  className,
}: ErrorStateProps) {
  const Icon = offline ? WifiOff : AlertTriangle;

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-border bg-bg-card px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
        <Icon size={26} aria-hidden />
      </div>
      <h3 className="mb-2 font-heading text-[17px] font-extrabold text-text-main">{title}</h3>
      <p className="mb-6 max-w-[420px] text-[13.5px] leading-relaxed text-text-secondary">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="secondary"
          onClick={onRetry}
          loading={retrying}
          leftIcon={<RefreshCw size={15} />}
        >
          Tekrar dene
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inline uyarı                                                        */
/* ------------------------------------------------------------------ */

export function InlineAlert({
  children,
  variant = "error",
}: {
  children: ReactNode;
  variant?: "error" | "info" | "success";
}) {
  const styles = {
    error: "border-red-500/30 bg-red-500/10 text-red-700",
    info: "border-primary/25 bg-primary-light text-primary",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  }[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "animate-fade-in flex items-start gap-2 rounded-2xl border px-4 py-3 text-[12.5px] font-semibold",
        styles,
      )}
    >
      {variant === "error" && <AlertTriangle size={14} className="mt-px shrink-0" aria-hidden />}
      <span className="min-w-0">{children}</span>
    </div>
  );
}
