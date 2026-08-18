import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { InstagramIcon } from "@/components/ui/BrandIcons";
import siteConfig from "@/data/site-config.json";

/**
 * Footer bağlantıları yalnızca GERÇEKTEN var olan sayfalara işaret eder.
 * "Yardım Merkezi", "SSS", "Nasıl Çalışır?" gibi başlıklar için sayfa
 * bulunmadığından eklenmedi — ölü bağlantı, eksik bağlantıdan kötüdür.
 */
const LINK_GROUPS = [
  {
    title: "Keşfet",
    links: [
      { href: "/", label: "Satışa Çıkan Anılar" },
      { href: "/muze", label: "Exift Müzesi" },
      { href: "/ilan-ver", label: "İlan Ver" },
      { href: "/sandik", label: "Sandığım" },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { href: "/hakkimizda", label: "Hakkımızda" },
      { href: "/kullanim-kosullari", label: "Kullanım Koşulları" },
      { href: "/gizlilik-politikasi", label: "Gizlilik Politikası" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-footer pt-14 pb-10 text-white">
      <Container size="wide">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="mb-4 inline-block">
              <span className="font-serif text-[28px] font-bold tracking-[-1.2px] text-white lowercase">
                exift
              </span>
            </Link>
            <p className="max-w-[42ch] text-[13.5px] leading-relaxed text-[#fbe6f1]">
              {siteConfig.footer.about}
            </p>
            <p className="mt-4 flex items-center gap-2 text-[13.5px] text-[#fbe6f1]">
              <MapPin size={14} className="shrink-0 text-[#ffafd9]" aria-hidden />
              {siteConfig.footer.location}
            </p>
          </div>

          {LINK_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="mb-4 font-heading text-[14px] font-bold tracking-wide text-white">
                {group.title}
              </h2>
              <ul className="flex flex-col gap-2.5">
                {group.links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-[13.5px] text-[#ffafd9] transition-colors hover:text-white focus-visible:rounded focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 lg:col-span-1">
            <h2 className="mb-4 font-heading text-[14px] font-bold tracking-wide text-white">
              İletişim
            </h2>
            <p className="mb-2.5 flex items-center gap-2 text-[13.5px] text-[#fbe6f1]">
              <Mail size={14} className="shrink-0 text-[#ffafd9]" aria-hidden />
              <a
                href={`mailto:${siteConfig.footer.email}`}
                className="break-all transition-colors hover:text-white"
              >
                {siteConfig.footer.email}
              </a>
            </p>
            <p className="flex items-center gap-2 text-[13.5px] text-[#fbe6f1]">
              <InstagramIcon size={14} className="shrink-0 text-[#ffafd9]" aria-hidden />
              <a
                href={siteConfig.footer.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                {new URL(siteConfig.footer.instagram).pathname
                  .split("/")
                  .filter(Boolean)[0]}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-[12.5px] text-[#ff8fc7]">
          {siteConfig.footer.copyright}
        </div>
      </Container>
    </footer>
  );
}
