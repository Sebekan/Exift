"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MailWarning } from "lucide-react";
import { toUserMessage } from "@/lib/api/errors";
import { authService } from "@/services";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/States";

type VerifyStatus = "checking" | "success" | "error";

function EmailVerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerifyStatus>(token ? "checking" : "error");
  const [error, setError] = useState<string | null>(
    token ? null : "Doğrulama bağlantısı eksik ya da geçersiz.",
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    authService
      .verifyEmail(token)
      .then(() => {
        if (!cancelled) setStatus("success");
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus("error");
          setError(toUserMessage(err, "Doğrulama bağlantısı geçersiz ya da süresi dolmuş."));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "checking") return <LoadingState message="E-postan doğrulanıyor..." />;

  return (
    <div className="mx-auto flex max-w-[480px] flex-col items-center px-[5%] py-24 text-center">
      {status === "success" ? (
        <>
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={26} aria-hidden />
          </div>
          <h1 className="mb-2 font-heading text-[19px] font-extrabold text-text-main">
            E-postan doğrulandı
          </h1>
          <p className="mb-6 text-[13.5px] leading-relaxed text-text-secondary">
            Hesabın artık doğrulanmış durumda.
          </p>
        </>
      ) : (
        <>
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <MailWarning size={26} aria-hidden />
          </div>
          <h1 className="mb-2 font-heading text-[19px] font-extrabold text-text-main">
            Doğrulanamadı
          </h1>
          <p className="mb-6 text-[13.5px] leading-relaxed text-text-secondary">{error}</p>
        </>
      )}
      <ButtonLink href="/profil">Profilime dön</ButtonLink>
    </div>
  );
}

export default function EmailVerifyPage() {
  return (
    <Container>
      <Suspense fallback={<LoadingState message="E-postan doğrulanıyor..." />}>
        <EmailVerifyContent />
      </Suspense>
    </Container>
  );
}
