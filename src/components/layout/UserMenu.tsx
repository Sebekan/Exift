"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Package, Settings, Tag, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppData } from "@/context/AppDataContext";
import { Avatar } from "@/components/ui/Avatar";

const MENU_LINKS = [
  { href: "/profil", label: "Profilimi Görüntüle", icon: User },
  { href: "/profil?bolum=ilanlarim", label: "İlanlarım", icon: Tag },
  { href: "/profil?bolum=sandigim", label: "Sandığım", icon: Package },
  { href: "/profil?bolum=ayarlar", label: "Ayarlar", icon: Settings },
];

/**
 * Header'daki profil düğmesi. Girişliyken açılır menü, anonimken doğrudan
 * giriş bağlantısı olur — anonim bir kullanıcıya "Çıkış Yap" göstermek anlamsız.
 */
export function UserMenu() {
  const { isAuthenticated, profile, logout } = useAppData();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!isAuthenticated || !profile) {
    return (
      <Link
        href={`/giris?to=${encodeURIComponent(pathname)}`}
        className={cn(
          "flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10.5px] font-semibold transition-colors",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          "text-text-secondary hover:text-primary",
        )}
      >
        <User size={19} className="text-text-main" aria-hidden />
        Giriş Yap
      </Link>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className={cn(
          "flex items-center gap-2 rounded-full border py-1 pr-2.5 pl-1 transition-colors",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
          open
            ? "border-primary bg-primary-light"
            : "border-border bg-bg-card hover:border-primary",
        )}
      >
        <Avatar nickname={profile.nickname} avatarUrl={profile.avatarUrl} size={32} />
        <span className="hidden max-w-[110px] truncate font-heading text-[12.5px] font-bold text-text-main xl:block">
          {profile.nickname}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "shrink-0 text-text-secondary transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Hesap menüsü"
          className="animate-fade-in absolute top-full right-0 z-50 mt-2 w-[268px] overflow-hidden rounded-2xl border border-border bg-bg-card shadow-hover"
        >
          {/* Kimin hesabında olunduğu her zaman görünsün. */}
          <div className="flex items-center gap-3 border-b border-border bg-bg-body px-4 py-3.5">
            <Avatar nickname={profile.nickname} avatarUrl={profile.avatarUrl} size={40} />
            <div className="min-w-0">
              <p className="truncate font-heading text-[13.5px] font-bold text-text-main">
                {profile.nickname}
              </p>
              <p className="truncate text-[11.5px] text-text-secondary">{profile.email}</p>
            </div>
          </div>

          <div className="p-1.5">
            {MENU_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-text-secondary transition-colors hover:bg-bg-body hover:text-text-main focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <Icon size={16} className="shrink-0 text-text-muted" aria-hidden />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-border p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logout();
                router.push("/");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <LogOut size={16} className="shrink-0" aria-hidden />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
