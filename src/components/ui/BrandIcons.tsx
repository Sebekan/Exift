import type { SVGProps } from "react";

/**
 * Marka (sosyal medya) ikonları.
 *
 * lucide-react marka ikonlarını kütüphaneden ÇIKARDI — kurulu sürümde
 * Instagram/Facebook/X gibi hiçbir brand glyph yok. Bunları lucide'ın çizim
 * diliyle (24 birim viewBox, stroke 2, yuvarlak uç/köşe) burada tutuyoruz;
 * böylece `Mail`, `MapPin` gibi lucide ikonlarıyla aynı satırda optik olarak
 * hizalanırlar ve `size`/`className` API'si aynı kalır.
 *
 * Renk `currentColor`'dan gelir — ikonlar kendi rengini dayatmaz.
 */
export interface BrandIconProps extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  size?: number;
}

export function InstagramIcon({
  size = 24,
  strokeWidth = 2,
  ...rest
}: BrandIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
