import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "primary" | "neutral" | "success" | "danger" | "museum" | "overlay";

const TONES: Record<BadgeTone, string> = {
  primary: "bg-primary-light text-primary",
  neutral: "bg-bg-body text-text-secondary border border-border",
  success: "bg-emerald-50 text-emerald-700",
  danger: "bg-red-50 text-red-600",
  museum: "border border-[#c9a877]/50 bg-[#c9a877]/12 text-[#a67c3d]",
  overlay: "bg-black/45 text-white backdrop-blur-sm",
};

export function Badge({
  children,
  tone = "primary",
  className,
  icon,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
