"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { LoadingState } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Korumalı sayfa sarmalayıcısı.
 *
 * Kritik nokta: oturum geri yüklenirken (`status === "loading"`) yönlendirme
 * YAPILMAZ. Aksi hâlde sayfa yenilendiğinde, token doğrulanmadan önce kullanıcı
 * giriş ekranına atılırdı — eski davranıştaki hata buydu.
 */
export function RequireAuth({
  children,
  message = "Bu sayfayı görüntülemek için giriş yapmalısın.",
}: {
  children: ReactNode;
  message?: string;
}) {
  const { status } = useAppData();
  const router = useRouter();
  const pathname = usePathname();

  const redirectTarget = `/giris?to=${encodeURIComponent(pathname)}`;

  useEffect(() => {
    if (status === "anonymous") router.replace(redirectTarget);
  }, [status, router, redirectTarget]);

  if (status === "loading") {
    return <LoadingState message="Oturumun kontrol ediliyor..." />;
  }

  if (status === "anonymous") {
    // Yönlendirme uçarken kısa bir an görünen yedek içerik.
    return (
      <div className="mx-auto flex max-w-[440px] flex-col items-center px-[5%] py-24 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary">
          <LogIn size={24} aria-hidden />
        </div>
        <h1 className="mb-2 font-heading text-[19px] font-extrabold text-text-main">
          Giriş yapman gerekiyor
        </h1>
        <p className="mb-6 text-[13.5px] leading-relaxed text-text-secondary">{message}</p>
        <ButtonLink href={redirectTarget}>Giriş Yap / Kayıt Ol</ButtonLink>
      </div>
    );
  }

  return <>{children}</>;
}
