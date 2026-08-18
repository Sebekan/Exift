import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/layout/LegalPage";
import siteConfig from "@/data/site-config.json";

export const metadata: Metadata = {
  title: "Biz Kimiz?",
  description:
    "Exift, geçmişten kalan eşyaları duygusal hikayeleriyle birlikte satabileceğin bir pazar yeri. Hikayemizi ve değerlerimizi keşfet.",
};

const VALUES = [
  { title: "Samimiyet", text: "Her hikaye gerçektir ve kişiseldir." },
  { title: "Topluluk", text: "Birbirimizin hikayelerine saygı duyarız." },
  { title: "Yeni başlangıçlar", text: "Her satış, bir kapanış ve bir açılıştır." },
  { title: "Güvenlik", text: "Kullanıcı verilerinin korunması önceliğimizdir." },
];

export default function AboutPage() {
  return (
    <LegalPage
      title="Biz Kimiz?"
      subtitle="Geçmişin izlerini silmek, yarım kalan hikayeleri nakite çevirmek ve yeni başlangıçlara yer açmak isteyenlerin buluşma noktası."
    >
      <LegalSection title="Exift nedir?">
        <p>
          Exift, geçmişin izlerini silmek, yarım kalan hikayeleri nakite çevirmek ve yeni
          başlangıçlara yer açmak isteyenlerin buluşma noktasıdır.
        </p>
      </LegalSection>

      <LegalSection title="Hikayemiz">
        <p>
          Herkesin bir çekmecesinde, bir köşesinde ya da dolabının derinliklerinde duran bir eşya
          vardır — bir kolye, bir tişört, bir kupa, belki bir teknoloji ürünü. Onlara her
          baktığınızda aklınıza bir hikaye gelir. Bazen tatlı, çoğu zaman buruk.
        </p>
        <p>
          Exift, 2026 yılında İstanbul&apos;da doğdu. Amacımız basit: insanların geçmişlerinden
          kalan eşyaları, onlara yüklenen duygusal hikayelerle birlikte satabilecekleri bir alan
          yaratmak. Burada her ilan bir ürün olmanın ötesinde bir anıdır. Her satış, bir veda ve
          yeni bir başlangıçtır.
        </p>
      </LegalSection>

      <LegalSection title="Ne yapıyoruz?">
        <ul>
          <li>
            Kullanıcılarımız eski ilişkilerinden kalan eşyaları hikayesiyle birlikte ilan olarak
            yayınlar.
          </li>
          <li>Alıcılar sadece bir ürün değil, bir hikaye satın alır.</li>
          <li>
            Satılan ürünler{" "}
            <Link href="/muze">&quot;Exift Müzesi&quot;</Link>ne taşınarak hikayeleri sonsuza kadar
            yaşatılır.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Misyonumuz">
        <p>
          Geçmişi silmek, geleceği inşa etmek. Duygusal yükten arınmanın en sağlıklı yolunun o
          eşyaya bir veda mektubu yazıp, onu yeni bir hikayeye göndermek olduğuna inanıyoruz.
        </p>
      </LegalSection>

      <LegalSection title="Değerlerimiz">
        <ul>
          {VALUES.map(({ title, text }) => (
            <li key={title}>
              <strong>{title}:</strong> {text}
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="İletişim">
        <p>Sorularınız, önerileriniz veya işbirliği talepleriniz için bize ulaşabilirsiniz:</p>
        <ul>
          <li>
            <strong>E-posta:</strong>{" "}
            <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>
          </li>
          <li>
            <strong>Konum:</strong> {siteConfig.footer.location}
          </li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
