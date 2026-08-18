import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Lora, Cormorant_Garamond } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "@/context/Providers";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Footer } from "@/components/layout/Footer";
import { SoftGateBar } from "@/components/layout/SoftGateBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SITE_DESCRIPTION =
  "Exift; geçmişten kalan eşyaları duygusal hikayeleriyle birlikte satışa çıkarabileceğin, yüklerinden kurtulup yeni başlangıçlar için yer açtığın bir pazar yeri.";

export const metadata: Metadata = {
  metadataBase: new URL("https://exift.com"),
  title: {
    default: "Exift | Geçmişi Sil, Yeni Başlangıçlara Yer Aç.",
    template: "%s | Exift",
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/exift.jpg",
    shortcut: "/exift.jpg",
    apple: "/exift.jpg",
  },
  openGraph: {
    title: "Exift | Geçmişi Sil, Yeni Başlangıçlara Yer Aç.",
    description: SITE_DESCRIPTION,
    siteName: "Exift",
    locale: "tr_TR",
    type: "website",
    images: [{ url: "/exift.jpg", width: 610, height: 628, alt: "Exift" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Exift | Geçmişi Sil, Yeni Başlangıçlara Yer Aç.",
    description: SITE_DESCRIPTION,
    images: ["/exift.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#d62162",
  // Kullanıcının yakınlaştırma hakkını kısıtlamıyoruz (erişilebilirlik).
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${jakarta.variable} ${lora.variable} ${cormorant.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Providers>
          {/* Klavye kullanıcıları gezinmeyi atlayıp doğrudan içeriğe geçebilsin. */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[6000] focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:font-heading focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
          >
            İçeriğe geç
          </a>

          <SoftGateBar />
          <Header />
          <main id="main-content" className="flex-1 pb-20 md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileBottomNav />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
