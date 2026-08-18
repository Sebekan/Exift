"use client";

import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Kritik akışlarda (ör. kaydedilmemiş değişiklik) dışarı tıklamayı kapat. */
  dismissOnBackdrop?: boolean;
  hideCloseButton?: boolean;
}

const SIZES = { sm: "max-w-[380px]", md: "max-w-[520px]", lg: "max-w-[720px]" } as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissOnBackdrop = true,
  hideCloseButton = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      // Odak tuzağı: Tab, diyalogun dışına çıkmasın.
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.addEventListener("keydown", handleKeyDown, true);

    // Arka planın kaymasını engelle; kaydırma çubuğu genişliğini telafi et.
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    // Açılışta ilk odaklanabilir öğeye geç.
    const focusTimer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? panelRef.current)?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      window.clearTimeout(focusTimer);
      previouslyFocused.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[4000] flex items-end justify-center p-0 sm:items-center sm:p-5">
      <div
        className="animate-fade-in absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={dismissOnBackdrop ? onClose : undefined}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "animate-sheet-up sm:animate-modal-pop relative w-full outline-none",
          "max-h-[92vh] overflow-y-auto rounded-t-3xl border border-border bg-bg-card shadow-[0_25px_60px_rgba(0,0,0,0.22)]",
          "sm:rounded-3xl",
          SIZES[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-7">
          <div className="min-w-0">
            <h2 id={titleId} className="font-heading text-[19px] font-extrabold text-text-main">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">
                {description}
              </p>
            )}
          </div>
          {!hideCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="-mt-1 -mr-1 shrink-0 rounded-full p-2 text-text-muted transition-colors hover:bg-bg-body hover:text-text-main focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {children && <div className="px-6 py-5 sm:px-7">{children}</div>}

        {footer && (
          <div className="flex flex-col-reverse gap-2.5 px-6 pt-2 pb-6 sm:flex-row sm:justify-end sm:px-7">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Geri alınamaz işlemler için onay penceresi. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onCancel}
      title={title}
      description={description}
      size="sm"
      dismissOnBackdrop={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading} className="sm:min-w-[120px]">
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
            className="sm:min-w-[140px]"
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
