"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bookmark, Heart, LogIn, MessageCircle, MessageSquare, X, type LucideIcon } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { useAuthGate, type SoftGateReason } from "@/context/AuthGateContext";

const REASON_COPY: Record<SoftGateReason, { icon: LucideIcon; text: string }> = {
  like: { icon: Heart, text: "Beğenmek için hesabına giriş yap." },
  comment: { icon: MessageCircle, text: "Yorum yapmak için hesabına giriş yap." },
  save: { icon: Bookmark, text: "Sandığına kaydetmek için hesabına giriş yap." },
  contact: { icon: MessageSquare, text: "Satıcıyla iletişime geçmek için hesabına giriş yap." },
};

const AUTO_DISMISS_MS = 3000;

/** Slim, dismissible top bar prompting sign-in for like/comment/save — a soft
 * gate rather than a full-screen wall, so unregistered visitors keep browsing. */
export function SoftGateBar() {
  const { isAuthenticated } = useAppData();
  const { softGateReason, dismissSoftGate } = useAuthGate();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthenticated) dismissSoftGate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (!softGateReason) return;
    const timer = setTimeout(dismissSoftGate, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [softGateReason, dismissSoftGate]);

  if (!softGateReason) return null;

  const { icon: Icon, text } = REASON_COPY[softGateReason];

  return (
    <div className="fixed inset-x-0 top-0 z-[3000] animate-slide-down border-b border-primary-hover/30 bg-primary px-4 py-2.5 shadow-[0_4px_20px_rgba(214,33,98,0.25)]">
      <div className="mx-auto flex max-w-[1300px] items-center gap-3">
        <Icon size={16} className="hidden shrink-0 text-white sm:block" />
        <p className="flex-1 text-[12.5px] font-semibold text-white sm:text-center">{text}</p>
        <button
          onClick={() => router.push(`/kayit?to=${encodeURIComponent(pathname)}`)}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-1.5 font-heading text-[12px] font-bold text-primary transition-transform hover:scale-[1.03]"
        >
          <LogIn size={13} /> Kayıt Ol
        </button>
        <button
          onClick={dismissSoftGate}
          aria-label="Kapat"
          className="shrink-0 rounded-full p-1 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
