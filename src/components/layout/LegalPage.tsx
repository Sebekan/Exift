import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";

/**
 * Kurumsal/hukuki sayfa düzeni.
 *
 * Bu sayfalar bir BELGEDİR, bir gösterge paneli değil. Bu yüzden kart, çerçeve,
 * gölge ve çok sütunlu yerleşim yok — bölümler tek bir okuma sütununda alt alta
 * akar:
 *
 *  - Kartlara bölmek maddeleri birbirinden kopuk parçalar gibi gösteriyordu;
 *    oysa "madde 4" ile "madde 5" aynı metnin devamıdır.
 *  - Çok sütunlu (masonry) akışta okurun gözü her sütun sonunda sayfanın başına
 *    dönüyordu; numaralı maddelerde okuma sırası tamamen kayboluyordu.
 *
 * Genişlik bilinçli olarak dar (`narrow`, 780px): amaç geniş ekranı doldurmak
 * değil, satır uzunluğunu okunabilir tutmaktır. Uzun hukuki metin tam genişliğe
 * yayıldığında satır başını bulmak zorlaşır.
 */
export function LegalPage({
  title,
  subtitle,
  updatedAt,
  children,
}: {
  title: string;
  subtitle?: string;
  updatedAt?: string;
  children: ReactNode;
}) {
  return (
    <div className="animate-rise-in">
      <Container size="narrow" className="py-12 md:py-16">
        {/* Belge künyesi — sola hizalı, arka plansız; gövdeden ince bir çizgiyle ayrılır. */}
        <header className="border-b border-border pb-8">
          <h1 className="font-display text-[32px] leading-tight font-bold tracking-[-0.5px] text-text-main italic sm:text-[40px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 font-serif text-[15.5px] leading-relaxed text-text-secondary italic sm:text-[16.5px]">
              {subtitle}
            </p>
          )}
          {updatedAt && (
            <p className="mt-5 text-[12px] font-semibold text-text-muted">
              Son güncelleme: {updatedAt}
            </p>
          )}
        </header>

        <div
          className={[
            "[&_h2]:font-heading [&_h2]:text-[18px] [&_h2]:font-extrabold [&_h2]:tracking-[-0.2px] [&_h2]:text-text-main",
            "[&_h3]:mt-2 [&_h3]:font-heading [&_h3]:text-[14.5px] [&_h3]:font-bold [&_h3]:text-text-main",
            "[&_p]:text-[14.5px] [&_p]:leading-[1.75] [&_p]:text-text-secondary",
            "[&_li]:text-[14.5px] [&_li]:leading-[1.75] [&_li]:text-text-secondary",
            "[&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5",
            "[&_strong]:font-bold [&_strong]:text-text-main",
            "[&_a]:font-semibold [&_a]:text-primary hover:[&_a]:underline",
          ].join(" ")}
        >
          {children}
        </div>
      </Container>
    </div>
  );
}

/**
 * Belge bölümü. Kutu değil: bölümleri birbirinden ayıran tek şey boşluktur.
 * Başlık ile kendi metni arasındaki boşluk (12px), iki bölüm arasındakinden
 * (40px) belirgin biçimde küçüktür — böylece hangi metnin hangi başlığa ait
 * olduğu çizgi çekmeden anlaşılır.
 */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2>{title}</h2>
      <div className="mt-3 flex flex-col gap-3.5">{children}</div>
    </section>
  );
}
