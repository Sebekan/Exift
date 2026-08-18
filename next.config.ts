import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Yüklenen tüm ilan/avatar görselleri Cloudinary'de barındırılıyor.
      // Bu host olmadan next/image üretimdeki her görseli reddederdi.
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Statik site içeriği (hero görseli vb.).
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },

      // --- GEÇİCİ: tüm dış hostlara izin ---
      // İlan görselleri şu an dışarıdan bağlantı olarak da girilebiliyor
      // (Pinterest, blog, rastgele CDN). Host beyaz listesi bu yüzden
      // tutulamıyor: her yeni kaynak next/image'ı 400'e düşürüyor.
      //
      // Kalıcı çözüm görselleri yalnızca Cloudinary'ye yükletmek. O zaman
      // aşağıdaki iki satırı silmek yeterli — üstteki kalıplar yerinde duruyor.
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    // Host kısıtı kalktığı için optimizer'ın çekeceği dosya boyutu sınırlanıyor
    // (varsayılan 50 MB). 5 MB platformun kendi kuralıyla aynı — bkz. Kullanım
    // Koşulları md. 3. Yerel/özel IP'ler `dangerouslyAllowLocalIP` varsayılan
    // olarak kapalı olduğu için hâlâ engelli.
    maximumResponseBody: 5_000_000,
  },
};

export default nextConfig;
