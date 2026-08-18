"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dark";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-[0_4px_12px_rgba(214,33,98,0.18)] hover:bg-primary-hover hover:shadow-[0_6px_18px_rgba(214,33,98,0.26)] active:shadow-[0_2px_8px_rgba(214,33,98,0.2)]",
  secondary:
    "border border-border bg-bg-card text-text-main hover:border-primary hover:text-primary",
  ghost: "bg-primary-light text-primary hover:bg-primary hover:text-white",
  danger:
    "bg-red-600 text-white shadow-[0_4px_12px_rgba(220,38,38,0.2)] hover:bg-red-700",
  dark: "bg-text-main text-bg-card hover:bg-primary hover:text-white",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 px-4 text-[12.5px]",
  md: "h-11 gap-2 px-5 text-[13.5px]",
  lg: "h-[52px] gap-2.5 px-7 text-[15px]",
};

const BASE =
  "inline-flex shrink-0 items-center justify-center rounded-2xl font-heading font-bold whitespace-nowrap " +
  "transition-[background-color,color,border-color,box-shadow,transform] duration-200 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-body " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55 " +
  // Hareket azaltma tercihine saygı — dönüşümler devre dışı kalır.
  "motion-reduce:transition-none motion-reduce:active:scale-100";

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export interface ButtonProps
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> {}

function Content({
  loading,
  leftIcon,
  rightIcon,
  children,
}: Pick<CommonProps, "loading" | "leftIcon" | "rightIcon" | "children">) {
  return (
    <>
      {loading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    children,
    className,
    disabled,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      // Yükleme sırasında çift gönderimi engelle.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      {...rest}
    >
      <Content loading={loading} leftIcon={leftIcon} rightIcon={rightIcon}>
        {children}
      </Content>
    </button>
  );
});

export interface ButtonLinkProps extends CommonProps {
  href: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  "aria-label"?: string;
}

/** Görsel olarak Button ile aynı, semantik olarak bağlantı. */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}

/** Kare ikon butonu — kart üzerindeki beğen/kaydet gibi aksiyonlar için. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, "leftIcon" | "rightIcon" | "fullWidth" | "size"> & {
    label: string;
    size?: number;
  }
>(function IconButton({ label, size = 44, className, children, loading, disabled, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      style={{ width: size, height: size }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-bg-card",
        "transition-[transform,background-color,border-color,box-shadow] duration-200",
        "hover:scale-[1.06] hover:border-primary active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-body",
        "disabled:pointer-events-none disabled:opacity-55",
        "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : children}
    </button>
  );
});
