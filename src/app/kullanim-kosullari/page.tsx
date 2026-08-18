import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/layout/LegalPage";
import siteConfig from "@/data/site-config.json";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "Exift platformunu kullanırken geçerli olan koşullar ve kurallar.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Kullanım Koşulları"
      subtitle="Exift platformunu kullanarak aşağıdaki koşulları kabul etmiş olursunuz. Lütfen dikkatlice okuyunuz."
      updatedAt="10 Ağustos 2026"
    >
      <LegalSection title="1. Tanımlar">
        <ul>
          <li>
            <strong>Platform:</strong> exift.com adresi üzerinden erişilebilen web uygulaması ve tüm
            alt hizmetleri.
          </li>
          <li>
            <strong>Kullanıcı:</strong> Platforma kayıt olan veya Platformu ziyaret eden gerçek kişi.
          </li>
          <li>
            <strong>İlan:</strong> Kullanıcı tarafından Platform üzerinde yayınlanan ürün ve hikaye
            içeriği.
          </li>
          <li>
            <strong>Hizmet:</strong> Exift tarafından sunulan tüm dijital hizmetler (ilan yayınlama,
            mesajlaşma, müze arşivi vb.).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Üyelik ve hesap">
        <ul>
          <li>
            Platforma kayıt olmak için geçerli bir e-posta adresi, bir kullanıcı adı, bir telefon
            numarası ve en az 6 karakterlik bir şifre gerekmektedir.
          </li>
          <li>Her kullanıcı yalnızca bir hesap açabilir.</li>
          <li>
            Hesap bilgilerinizin güvenliğinden siz sorumlusunuz. Şifrenizi üçüncü kişilerle
            paylaşmayınız.
          </li>
          <li>
            Exift, şüpheli veya kurallara aykırı bulunan hesapları önceden bildirimde bulunmaksızın
            askıya alma veya kapatma hakkını saklı tutar.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. İlan yayınlama kuralları">
        <ul>
          <li>İlanlar yalnızca kişisel eşyalar için açılabilir.</li>
          <li>Her ilanın bir hikaye (minimum 50 karakter) içermesi zorunludur.</li>
          <li>
            Yüklenen görseller en fazla 5 MB boyutunda olmalı ve yalnızca görsel formatlarında (JPG,
            PNG, WebP) kabul edilir.
          </li>
        </ul>
        <p>Aşağıdaki içerikler kesinlikle yasaktır:</p>
        <ul>
          <li>Yasadışı, çalıntı veya sahte ürünler</li>
          <li>Nefret söylemi, ayrımcılık veya hakaret içeren hikayeler</li>
          <li>Üçüncü kişilerin izinsiz fotoğrafları veya kişisel bilgileri</li>
          <li>Cinsel içerikli, müstehcen veya şiddete teşvik eden materyaller</li>
          <li>Ticari amaçlı toplu satış ilanları</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Satış ve ödeme">
        <ul>
          <li>
            Exift bir pazar yeri platformudur; alıcı ve satıcı arasındaki işlemde doğrudan taraf
            değildir.
          </li>
          <li>
            Platform üzerinden yapılan görüşmeler ve anlaşmalar tamamen kullanıcıların
            sorumluluğundadır.
          </li>
          <li>Fiyatlar Türk Lirası (TRY) cinsinden belirlenir.</li>
          <li>
            Exift, şu an için ödeme aracılık hizmeti sunmamaktadır. Ödeme detayları kullanıcılar
            arasında mesajlaşma yoluyla belirlenir.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Exift Müzesi">
        <ul>
          <li>
            Satıldı olarak işaretlenen ilanlar <Link href="/muze">Exift Müzesi</Link>&apos;ne
            taşınır.
          </li>
          <li>Müzeye taşınan hikayeler, platformda kalıcı olarak sergilenir.</li>
          <li>
            Kullanıcılar, ilanlarını satıldı olarak işaretleyerek hikayelerinin müzede
            yayınlanmasına onay vermiş olur.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Mesajlaşma">
        <ul>
          <li>Kullanıcılar, ilanlar üzerinden satıcılarla iletişime geçebilir.</li>
          <li>
            Mesajlaşma özelliği yalnızca ilan bazlı alışveriş iletişimi için kullanılmalıdır.
          </li>
          <li>
            Spam, taciz veya rahatsız edici mesajlar gönderen kullanıcıların hesapları kapatılır.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Fikri mülkiyet">
        <ul>
          <li>Platform üzerindeki tüm tasarım, logo, yazılım ve içerik Exift&apos;e aittir.</li>
          <li>
            Kullanıcılar, yayınladıkları hikaye ve görsellerin kendilerine ait olduğunu veya paylaşma
            haklarına sahip olduklarını beyan eder.
          </li>
          <li>
            Exift, kullanıcı tarafından yayınlanan içerikleri platformda görüntüleme, arşivleme ve
            müzede sergileme hakkına sahiptir.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Sorumluluk sınırlaması">
        <ul>
          <li>
            Exift, kullanıcılar arasındaki anlaşmazlıklardan, ürün kalitesinden veya teslimat
            süreçlerinden sorumlu tutulamaz.
          </li>
          <li>
            Platform &quot;olduğu gibi&quot; sunulmaktadır; kesintisiz veya hatasız çalışma garantisi
            verilmez.
          </li>
          <li>
            Exift, önceden bildirimde bulunarak hizmet koşullarını güncelleme hakkını saklı tutar.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Hesap silme">
        <ul>
          <li>
            Kullanıcılar, hesaplarının silinmesini{" "}
            <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a> adresine
            yazarak talep edebilir.
          </li>
          <li>
            Hesap silindiğinde, kullanıcıya ait ilanlar ve mesajlar sistemden kaldırılır. Ancak
            müzede yer alan satılmış ilanlar anonim olarak korunabilir.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="10. Uygulanacak hukuk">
        <ul>
          <li>Bu koşullar Türkiye Cumhuriyeti kanunlarına tabidir.</li>
          <li>Uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.</li>
        </ul>
      </LegalSection>

      <LegalSection title="11. İletişim">
        <p>
          Kullanım koşulları hakkında sorularınız için:{" "}
          <a href={`mailto:${siteConfig.contact.email}`}>
            <strong>{siteConfig.contact.email}</strong>
          </a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
