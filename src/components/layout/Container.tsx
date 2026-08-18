import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Sayfa içerik kabı.
 *
 * Önceki düzen `max-w-[1300px]` + `px-[5%]` kullanıyordu: 1920px'lik bir ekranda
 * yüzde tabanlı iç boşluk 96px, ardından içerik 1300px'e kırpılıyor ve iki yanda
 * ~310px ölü alan kalıyordu. Artık iç boşluk sabit basamaklarla büyür, genişlik
 * ise içeriğin türüne göre belirlenir — geniş ekran değerlendirilir ama satır
 * uzunluğu okunabilirlik sınırını aşmaz.
 */

export type ContainerSize = "narrow" | "content" | "wide" | "full";

const SIZES: Record<ContainerSize, string> = {
  /** Formlar, hukuki metinler — okunabilir satır uzunluğu önceliklidir. */
  narrow: "max-w-[780px]",
  /** Tek sütunlu akışlar (ilan oluşturma, sohbet). */
  content: "max-w-[1080px]",
  /** Izgara düzenleri — geniş ekranı gerçekten kullanır. */
  wide: "max-w-[1600px]",
  /** Kenardan kenara; iç boşluk yine korunur. */
  full: "max-w-none",
};

export function Container({
  size = "wide",
  className,
  children,
}: {
  size?: ContainerSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        // Sabit basamaklar: mobilde sıkı, geniş ekranda ferah ama orantısız değil.
        "px-4 sm:px-6 lg:px-8 xl:px-12",
        SIZES[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
