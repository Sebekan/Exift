"use client";

import { LogOut, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { UserProfile } from "@/types";
import { formatDate } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";

export interface ProfileSection<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
  count?: number;
}

export interface ProfileSidebarProps<T extends string> {
  profile: UserProfile;
  sections: ProfileSection<T>[];
  active: T;
  onSelect: (id: T) => void;
  onLogout: () => void;
}

/**
 * Profil bölüm navigasyonu.
 *
 * Sekme şeridi yerine kenar çubuğu: bölüm sayısı arttıkça sekmeler yatayda
 * sıkışıyor ve mobilde kayan bir şeride dönüşüyordu. Kenar çubuğu masaüstünde
 * hepsini aynı anda gösterir; dar ekranda aynı liste yatay kayan bir şeride
 * düşer (mobilde dikey liste ekranın yarısını yerdi).
 */
export function ProfileSidebar<T extends string>({
  profile,
  sections,
  active,
  onSelect,
  onLogout,
}: ProfileSidebarProps<T>) {
  return (
    <>
      {/* Masaüstü: yapışkan kenar çubuğu */}
      <aside className="hidden w-[262px] shrink-0 lg:block">
        <div className="sticky top-24 flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-bg-card p-5 text-center shadow-card">
            <Avatar
              nickname={profile.nickname}
              avatarUrl={profile.avatarUrl}
              size={76}
              className="mx-auto mb-3 border-4 border-bg-card shadow-hover"
            />
            <p className="mb-0.5 truncate font-heading text-[15px] font-extrabold text-text-main">
              {profile.nickname}
            </p>
            <p className="truncate text-[11.5px] text-text-secondary">{profile.email}</p>
            <p className="mt-2 text-[11px] text-text-muted">
              Katıldı: {formatDate(profile.joinedAt)}
            </p>
          </div>

          <nav aria-label="Profil bölümleri" className="rounded-2xl border border-border bg-bg-card p-2 shadow-card">
            {sections.map(({ id, label, icon: Icon, count }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelect(id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left font-heading text-[13.5px] font-semibold transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                    isActive
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:bg-bg-body hover:text-text-main",
                  )}
                >
                  <Icon size={17} className="shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {typeof count === "number" && (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums",
                        isActive ? "bg-white/25 text-white" : "bg-border text-text-secondary",
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={onLogout}
              className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-border px-3.5 py-3 text-left font-heading text-[13.5px] font-semibold text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <LogOut size={17} className="shrink-0" aria-hidden />
              Çıkış Yap
            </button>
          </nav>
        </div>
      </aside>

      {/* Mobil/tablet: yatay kayan bölüm şeridi */}
      <nav
        aria-label="Profil bölümleri"
        className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden"
      >
        {sections.map(({ id, label, icon: Icon, count }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2.5 font-heading text-[12.5px] font-semibold whitespace-nowrap transition-colors",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-bg-card text-text-secondary",
              )}
            >
              <Icon size={14} aria-hidden />
              {label}
              {typeof count === "number" && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10.5px] font-bold tabular-nums",
                    isActive ? "bg-white/25" : "bg-border",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
