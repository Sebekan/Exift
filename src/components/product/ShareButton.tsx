"use client";

import { useState, type ReactNode } from "react";
import { Check, Link2 } from "lucide-react";

interface ShareButtonProps {
  title: string;
  text: string;
  /** Path relative to the site origin, e.g. `/ilan/p1`. */
  path: string;
  align?: "left" | "right";
  direction?: "down" | "up";
  children: (opts: { onClick: () => void }) => ReactNode;
}

/** Renders its own trigger via a render prop, so it can be styled to match any
 * button (card icon, dark story overlay, etc.). Uses the native share sheet
 * when available — on mobile this already surfaces WhatsApp/Instagram as
 * targets — and falls back to a small popover with WhatsApp + copy-link. */
export function ShareButton({ title, text, path, align = "right", direction = "down", children }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function getUrl() {
    return typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
  }

  async function handleTriggerClick() {
    const url = getUrl();
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* user cancelled the native share sheet — ignore */
      }
      return;
    }
    setOpen((v) => !v);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${text} ${getUrl()}`)}`;

  return (
    <div className="relative">
      {children({ onClick: handleTriggerClick })}
      {open && (
        <>
          <button
            aria-label="Kapat"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute z-50 w-56 overflow-hidden rounded-2xl border border-border bg-bg-card p-1.5 shadow-hover ${
              align === "right" ? "right-0" : "left-0"
            } ${direction === "down" ? "top-full mt-2" : "bottom-full mb-2"}`}
          >
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-text-main transition-colors hover:bg-primary-light hover:text-primary"
            >
              WhatsApp&apos;ta Paylaş
            </a>
            <button
              onClick={handleCopy}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-text-main transition-colors hover:bg-primary-light hover:text-primary"
            >
              {copied ? (
                <>
                  <Check size={15} className="text-green-600" /> Kopyalandı
                </>
              ) : (
                <>
                  <Link2 size={15} /> Bağlantıyı Kopyala
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
