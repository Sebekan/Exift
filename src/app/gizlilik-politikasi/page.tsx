import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/layout/LegalPage";
import siteConfig from "@/data/site-config.json";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description:
    "Exift'in hangi verileri topladığı, nasıl kullandığı ve nasıl koruduğu hakkında KVKK uyumlu bilgilendirme.",
};

/** Tümü zorunlu alanlar; bu bilgi liste başlığında bir kez veriliyor. */
const REGISTRATION_DATA = [
  { field: "Kullanıcı adı (nickname)", purpose: "Profil kimliği, platform içi görünürlük" },
  { field: "E-posta adresi", purpose: "Hesap doğrulama, iletişim" },
  { field: "Telefon numarası", purpose: "Hesap doğrulama, kullanıcılar arası iletişim" },
  { field: "Şifre", purpose: "Hesap güvenliği (bcrypt ile şifrelenerek saklanır)" },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Gizlilik Politikası"
      subtitle="Exift olarak kullanıcılarımızın gizliliğine büyük önem veriyoruz. Bu politika, hangi verileri topladığımızı, nasıl kullandığımızı ve nasıl koruduğumuzu açıklar."
      updatedAt="10 Ağustos 2026"
    >
      <LegalSection title="1. Toplanan veriler">
        <h3>1.1 Kayıt sırasında</h3>
        <p>Hesap oluşturmak için aşağıdaki bilgilerin tamamı zorunludur:</p>
        <ul>
          {REGISTRATION_DATA.map((row) => (
            <li key={row.field}>
              <strong>{row.field}:</strong> {row.purpose}
            </li>
          ))}
        </ul>

        <h3>1.2 Profil bilgileri (isteğe bağlı)</h3>
        <ul>
          <li>Biyografi metni</li>
          <li>Profil fotoğrafı (Cloudinary üzerinde barındırılır)</li>
        </ul>

        <h3>1.3 İlan yayınlama sırasında</h3>
        <ul>
          <li>Ürün başlığı, açıklaması ve fiyatı</li>
          <li>Hikaye metni</li>
          <li>Yüklenen görseller</li>
          <li>Seçilen kategori ve İstanbul ilçesi</li>
        </ul>

        <h3>1.4 Platform kullanımı sırasında</h3>
        <ul>
          <li>Beğeniler ve favoriler</li>
          <li>Yorumlar ve yorum beğenileri</li>
          <li>Mesajlaşma içerikleri (satıcı-alıcı arası)</li>
        </ul>

        <h3>1.5 Otomatik olarak toplanan veriler</h3>
        <ul>
          <li>Hesap oluşturulma tarihi</li>
          <li>Oturum bilgileri (JWT token — 7 gün geçerli)</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Verilerin kullanım amaçları">
        <ul>
          <li>Platform hizmetlerinin sunulması ve iyileştirilmesi</li>
          <li>Kullanıcı hesabının oluşturulması ve yönetimi</li>
          <li>İlanların yayınlanması ve görüntülenmesi</li>
          <li>Kullanıcılar arası mesajlaşma hizmetinin sağlanması</li>
          <li>Müze arşivinin oluşturulması</li>
          <li>Platform güvenliğinin sağlanması</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Verilerin saklanması ve güvenliği">
        <ul>
          <li>
            Şifreler bcrypt algoritması ile hash&apos;lenerek saklanır; düz metin olarak hiçbir zaman
            tutulmaz.
          </li>
          <li>
            Kimlik doğrulama JWT (JSON Web Token) ile yapılır; tokenlar 7 gün süreyle geçerlidir.
          </li>
          <li>Görseller Cloudinary altyapısında güvenli olarak barındırılır.</li>
          <li>
            Veritabanı PostgreSQL üzerinde çalışır ve endüstri standartlarında güvenlik önlemleri
            uygulanır.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Verilerin paylaşımı">
        <p>Kişisel verileriniz aşağıdaki durumlar dışında üçüncü taraflarla paylaşılmaz:</p>
        <ul>
          <li>
            <strong>Cloudinary:</strong> Yüklenen görsellerin barındırılması için.
          </li>
          <li>
            <strong>Yasal zorunluluk:</strong> Mahkeme kararı veya yasal talep halinde yetkili
            makamlarla.
          </li>
          <li>
            <strong>Platform güvenliği:</strong> Dolandırıcılık veya kötüye kullanım tespiti
            durumunda.
          </li>
        </ul>
        <p>
          Verileriniz hiçbir koşulda reklam veya pazarlama amacıyla üçüncü taraflara satılmaz.
        </p>
      </LegalSection>

      <LegalSection title="5. Çerezler ve yerel depolama">
        <ul>
          <li>
            Platform, oturum yönetimi için tarayıcınızın localStorage özelliğini kullanır (JWT token
            saklama).
          </li>
          <li>Şu an için üçüncü taraf çerezleri veya izleme araçları kullanılmamaktadır.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Kullanıcı hakları">
        <ul>
          <li>
            <strong>Erişim hakkı:</strong> Hakkınızda saklanan verileri öğrenme.
          </li>
          <li>
            <strong>Düzeltme hakkı:</strong> Yanlış veya eksik bilgilerin düzeltilmesini talep etme.
          </li>
          <li>
            <strong>Silme hakkı:</strong> Hesabınızın ve verilerinizin silinmesini isteme.
          </li>
          <li>
            <strong>İtiraz hakkı:</strong> Verilerinizin işlenmesine itiraz etme.
          </li>
        </ul>
        <p>
          Bu haklarınızı kullanmak için{" "}
          <a href={`mailto:${siteConfig.contact.email}`}>
            <strong>{siteConfig.contact.email}</strong>
          </a>{" "}
          adresine başvurabilirsiniz.
        </p>
      </LegalSection>

      <LegalSection title="7. Veri saklama süresi">
        <ul>
          <li>Aktif hesap verileri, hesap silinene kadar saklanır.</li>
          <li>Hesap silindikten sonra kişisel veriler 30 gün içinde sistemden kaldırılır.</li>
          <li>
            Müzede yer alan satılmış ilanlar anonim hale getirilerek arşivde korunabilir.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="8. 6698 sayılı KVKK kapsamında">
        <p>
          Bu gizlilik politikası, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamındaki
          yükümlülüklerimize uygun olarak hazırlanmıştır. Veri sorumlusu sıfatıyla Exift, kişisel
          verilerinizi hukuka uygun şekilde işlemekte ve korumaktadır.
        </p>
      </LegalSection>

      <LegalSection title="9. Değişiklikler">
        <p>
          Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler yapılması halinde
          kullanıcılarımız platform üzerinden bilgilendirilecektir.
        </p>
      </LegalSection>

      <LegalSection title="10. İletişim">
        <p>
          Gizlilik politikası hakkında sorularınız için:{" "}
          <a href={`mailto:${siteConfig.contact.email}`}>
            <strong>{siteConfig.contact.email}</strong>
          </a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
