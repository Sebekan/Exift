"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";

export interface AvatarProps {
  /** Eksik/boş olabilir (silinmiş kullanıcı, eski API yanıtı) — kırılmamalı. */
  nickname?: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  /** Kart üzerindeki koyu zeminlerde kullanılan varyant. */
  tone?: "primary" | "muted";
}

/**
 * Görsel yoksa baş harfe düşer. `nickname` boş olabilir (silinmiş kullanıcı),
 * o durumda da tek harflik güvenli bir çıktı verir.
 */
export function Avatar({
  nickname,
  avatarUrl,
  size = 40,
  className,
  tone = "primary",
}: AvatarProps) {
  const safeName = (nickname ?? "").trim();
  const letter = safeName.charAt(0).toUpperCase() || "E";

  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        tone === "primary"
          ? "bg-gradient-to-br from-primary to-accent text-white"
          : "bg-border text-text-secondary",
        className,
      )}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={safeName}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="font-heading font-bold"
          style={{ fontSize: Math.max(11, Math.round(size * 0.4)) }}
        >
          {letter}
        </span>
      )}
    </span>
  );
}
