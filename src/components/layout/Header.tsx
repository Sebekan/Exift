"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CirclePlus, Landmark, LogOut, Menu, MessageCircle, Search, Store, User, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useResettableState } from "@/hooks/useResettableState";
import { useAppData } from "@/context/AppDataContext";
import { Avatar } from "@/components/ui/Avatar";
import { UserMenu } from "@/components/layout/UserMenu";
import { Container } from "@/components/layout/Container";
import { SandikIcon } from "@/components/ui/SandikIcon";

const NAV_ITEMS = [
  { href: "/", label: "Ana Sayfa", icon: Store, guarded: false, exact: true },
  { href: "/muze", label: "Müze", icon: Landmark, guarded: false, exact: false },
  { href: "/mesajlar", label: "Mesajlar", icon: MessageCircle, guarded: true, exact: false },
  { href: "/sandik", label: "Sandığım", icon: SandikIcon, guarded: true, exact: false },
] as const;

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, profile, chats, logout } = useAppData();
  const [query, setQuery] = useState("");

  // Menü durumu yola bağlıdır: gezinme olduğunda render sırasında kapanır.
  // Effect içinde setState yapmak fazladan bir render turu ve menünün bir kare
  // boyunca açık kalmasına yol açardı.
  const [menuOpen, setMenuOpen] = useResettableState(pathname, () => false);

  // Menü açıkken arka plan kaymasın.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    // Arama ana sayfadaki filtre sistemine devredilir (tek doğruluk kaynağı URL).
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}#ilanlar` : "/");
    setQuery("");
  }

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  function guardedNav(event: React.MouseEvent, href: string, guarded: boolean) {
    if (guarded && !isAuthenticated) {
      event.preventDefault();
      router.push(`/giris?to=${encodeURIComponent(href)}`);
    }
  }

  return (
    <header className="sticky top-0 z-[2000] border-b border-border bg-bg-panel backdrop-blur-xl">
      <Container size="wide">
        <div className="grid h-[68px] grid-cols-[auto_1fr_auto] items-center gap-3 md:h-20 md:gap-5">
          <Link
            href="/"
            aria-label="Exift ana sayfa"
            className="shrink-0 transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-reduce:hover:scale-100"
          >
            <span className="font-serif text-[27px] font-bold tracking-[-1.2px] text-[#5c1030] lowercase md:text-[32px]">
              exift
            </span>
          </Link>

          {/* Logo ile sağdaki menü arasında ortalanır; genişlik artırıldı, yükseklik azaltıldı. */}
          <form
            onSubmit={handleSearch}
            role="search"
            className="relative mx-auto hidden w-full max-w-[560px] min-w-0 md:block"
          >
            <Search
              className="pointer-events-none absolute top-1/2 left-[18px] -translate-y-1/2 text-primary"
              size={16}
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="İlan veya hikâye ara..."
              aria-label="İlan ara"
              className="h-10 w-full rounded-full border border-border bg-bg-card pr-4 pl-12 text-[13.5px] font-medium text-text-main shadow-card transition-[border-color,box-shadow] outline-none focus:border-primary focus:ring-4 focus:ring-primary-light"
            />
          </form>

          <div className="flex items-center gap-3 md:gap-5">
            <nav aria-label="Ana gezinme" className="hidden items-center gap-1 lg:flex">
              {NAV_ITEMS.map(({ href, label, icon: Icon, guarded, exact }) => {
                const active = isActive(href, exact);
                const showBadge = href === "/mesajlar" && isAuthenticated && chats.length > 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={(e) => guardedNav(e, href, guarded)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10.5px] font-semibold transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                      active ? "text-primary" : "text-text-secondary hover:text-primary",
                    )}
                  >
                    <span className="relative">
                      <Icon size={19} className={active ? "text-primary" : "text-text-main"} aria-hidden />
                      {showBadge && (
                        <span
                          className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white tabular-nums"
                          aria-label={`${chats.length} sohbet`}
                        >
                          {chats.length > 9 ? "9+" : chats.length}
                        </span>
                      )}
                    </span>
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden shrink-0 lg:block">
              <UserMenu />
            </div>

            <Link
              href="/ilan-ver"
              onClick={(e) => guardedNav(e, "/ilan-ver", true)}
              className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-4 font-heading text-[13px] font-bold whitespace-nowrap text-white shadow-[0_4px_12px_rgba(214,33,98,0.18)] transition-[transform,background-color,box-shadow] hover:-translate-y-px hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:hover:translate-y-0 md:h-12 md:px-6"
            >
              <CirclePlus size={16} aria-hidden />
              <span className="hidden sm:inline">İlan Ver</span>
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Menüyü aç"
              aria-expanded={menuOpen}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-bg-card text-text-main transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none lg:hidden"
            >
              <Menu size={19} />
            </button>
          </div>
        </div>
      </Container>

      {/*
        Menü, header'ın DIŞINA (document.body) portal ile taşınır.

        Neden: header'da `backdrop-blur-xl` var. `backdrop-filter` (ve `filter`)
        tanımlı bir element, `position: fixed` torunları için bir "containing
        block" oluşturur. Menü header'ın içinde kalsaydı `fixed inset-0`
        viewport'a değil header'ın 68px'lik kutusuna göre konumlanır, panel
        header yüksekliğinde kırpılır ve sayfa içeriği menünün altından
        görünürdü.
      */}
      {menuOpen &&
        createPortal(
          <div className="fixed inset-0 z-[2500] lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menü"
            className="animate-slide-in-right absolute inset-y-0 right-0 flex w-[300px] max-w-[85vw] flex-col border-l border-border bg-bg-card shadow-[0_0_60px_rgba(0,0,0,0.2)]"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="font-serif text-[24px] font-bold tracking-[-1px] text-[#5c1030] lowercase">
                exift
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Menüyü kapat"
                className="rounded-full p-2 text-text-muted transition-colors hover:bg-bg-body hover:text-text-main focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <X size={19} />
              </button>
            </div>

            {isAuthenticated && profile && (
              <Link
                href="/profil"
                className="flex items-center gap-3 border-b border-border px-5 py-4 transition-colors hover:bg-bg-body"
              >
                <Avatar nickname={profile.nickname} avatarUrl={profile.avatarUrl} size={42} />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold text-text-main">
                    {profile.nickname}
                  </p>
                  <p className="text-[12px] text-text-secondary">Profilimi görüntüle</p>
                </div>
              </Link>
            )}

            <form onSubmit={handleSearch} role="search" className="relative border-b border-border p-4">
              <Search
                className="pointer-events-none absolute top-1/2 left-8 -translate-y-1/2 text-primary"
                size={16}
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="İlan ara..."
                aria-label="İlan ara"
                className="h-11 w-full rounded-full border border-border bg-bg-body pr-4 pl-11 text-[13.5px] text-text-main outline-none focus:border-primary focus:bg-bg-card"
              />
            </form>

            <nav aria-label="Menü" className="flex-1 overflow-y-auto p-3">
              {NAV_ITEMS.map(({ href, label, icon: Icon, guarded, exact }) => {
                const active = isActive(href, exact);
                const showBadge = href === "/mesajlar" && isAuthenticated && chats.length > 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={(e) => guardedNav(e, href, guarded)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 font-heading text-[14px] font-semibold transition-colors",
                      active
                        ? "bg-primary-light text-primary"
                        : "text-text-secondary hover:bg-bg-body hover:text-text-main",
                    )}
                  >
                    <Icon size={18} aria-hidden />
                    {label}
                    {showBadge && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10.5px] font-bold text-white tabular-nums">
                        {chats.length}
                      </span>
                    )}
                  </Link>
                );
              })}

              <Link
                href="/profil"
                onClick={(e) => guardedNav(e, "/profil", true)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 font-heading text-[14px] font-semibold transition-colors",
                  pathname.startsWith("/profil")
                    ? "bg-primary-light text-primary"
                    : "text-text-secondary hover:bg-bg-body hover:text-text-main",
                )}
              >
                <User size={18} aria-hidden />
                {isAuthenticated ? "Profilim" : "Giriş Yap"}
              </Link>
            </nav>

            {isAuthenticated && (
              <div className="border-t border-border p-3">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                    router.push("/");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-heading text-[14px] font-semibold text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <LogOut size={18} aria-hidden />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
