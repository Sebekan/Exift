"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastVariant = "success" | "error" | "neutral";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
  /** Hata bildirimi için kısayol. */
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION_MS = 3200;
const MAX_VISIBLE = 3;

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "bg-primary text-white",
  error: "bg-red-600 text-white",
  neutral: "bg-text-main text-bg-card",
};

const VARIANT_ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  neutral: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = nextId.current++;
      // En yeni altta; eskiler taşarsa düşer.
      setToasts((prev) => [...prev, { id, message, variant }].slice(-MAX_VISIBLE));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DURATION_MS),
      );
    },
    [dismiss],
  );

  const showError = useCallback(
    (message: string) => showToast(message, "error"),
    [showToast],
  );

  // Sayfa kapanırken bekleyen zamanlayıcıları temizle.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showError }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[5000] flex flex-col items-center gap-2 px-4 md:bottom-8"
      >
        {toasts.map((toast) => {
          const Icon = VARIANT_ICONS[toast.variant];
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                "animate-toast-in pointer-events-auto flex max-w-[92vw] items-center gap-2.5 rounded-full py-3 pr-2.5 pl-5",
                "text-[13px] font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
                VARIANT_STYLES[toast.variant],
              )}
            >
              <Icon size={16} className="shrink-0" aria-hidden />
              <span className="min-w-0 break-words">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Bildirimi kapat"
                className="ml-1 shrink-0 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
