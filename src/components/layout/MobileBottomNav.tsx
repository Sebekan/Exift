"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CirclePlus, MessageCircle, Store, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppData } from "@/context/AppDataContext";
import { SandikIcon } from "@/components/ui/SandikIcon";

/**
 * Etiketler header ile birebir aynı olmalı ("Anasayfa" / "Ana Sayfa" gibi iki
 * ayrı yazım kullanıcıya iki farklı yer gibi görünür). Müze bilinçli olarak
 * burada değil: alt gezinme başparmak bölgesidir ve kişisel/aksiyon odaklı
 * kalmalı — Müze'ye header menüsünden, hero kartından ve footer'dan ulaşılır.
 */
const ITEMS = [
  { href: "/", label: "Ana Sayfa", icon: Store, guarded: false, exact: true },
  { href: "/sandik", label: "Sandığım", icon: SandikIcon, guarded: true, exact: false },
  { href: "/ilan-ver", label: "İlan Ver", icon: CirclePlus, guarded: true, exact: false, accent: true },
  { href: "/mesajlar", label: "Mesajlar", icon: MessageCircle, guarded: true, exact: false },
  { href: "/profil", label: "Profilim", icon: User, guarded: true, exact: false },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, chats } = useAppData();

  function handleClick(event: React.MouseEvent, href: string, guarded: boolean) {
    if (guarded && !isAuthenticated) {
      event.preventDefault();
      router.push(`/giris?to=${encodeURIComponent(href)}`);
    }
  }

  return (
    <nav
      aria-label="Alt gezinme"
      className="fixed inset-x-0 bottom-0 z-[2000] flex h-[66px] items-stretch justify-around border-t border-border bg-bg-panel px-1 shadow-[0_-5px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {ITEMS.map((item) => {
        const { href, label, icon: Icon, guarded, exact } = item;
        const accent = "accent" in item && item.accent;
        const active = exact ? pathname === href : pathname.startsWith(href);
        const showBadge = href === "/mesajlar" && isAuthenticated && chats.length > 0;

        return (
          <Link
            key={href}
            href={href}
            onClick={(e) => handleClick(e, href, guarded)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-[3px] text-[9.5px] font-semibold",
              "focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
              active ? "text-primary" : "text-text-secondary",
            )}
          >
            <span className="relative flex items-center justify-center">
              {accent ? (
                // Ana aksiyon görsel olarak öne çıkar (pazar yeri yaklaşımı).
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-[0_3px_10px_rgba(214,33,98,0.3)]">
                  <Icon size={18} aria-hidden />
                </span>
              ) : (
                <Icon size={20} className={active ? "text-primary" : "text-text-main"} aria-hidden />
              )}
              {showBadge && (
                <span
                  className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white tabular-nums"
                  aria-label={`${chats.length} sohbet`}
                >
                  {chats.length > 9 ? "9+" : chats.length}
                </span>
              )}
            </span>
            <span className="max-w-full truncate px-0.5">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
