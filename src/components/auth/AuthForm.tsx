"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, AtSign, Eye, EyeOff, Lock, LogIn, ShieldCheck, Sparkles, User, UserPlus } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { InlineAlert } from "@/components/ui/States";
import { PhoneField } from "./PhoneField";
import { cn } from "@/lib/cn";
import { DEFAULT_COUNTRY, toE164, validatePhone, type Country } from "@/lib/phone";
import {
  passwordStrength,
  validateEmail,
  validateNickname,
  validatePassword,
  type FieldErrors,
} from "@/lib/validation";
import siteConfig from "@/data/site-config.json";

type Mode = "sign-in" | "sign-up";
type Field = "nickname" | "email" | "password" | "passwordConfirm" | "phone";

/** Açık yönlendirme (open redirect) önlemi: yalnızca site içi yollara izin ver. */
function safeRedirect(target: string | null): string {
  if (!target) return "/";
  if (!target.startsWith("/") || target.startsWith("//")) return "/";
  return target;
}

/** Kullanıcıya görünen rotalar Türkçedir; mod adları yalnızca kod içi kalır. */
const ROUTES: Record<Mode, string> = { "sign-in": "/giris", "sign-up": "/kayit" };

function tabHref(tab: Mode, redirect: string | null) {
  const path = ROUTES[tab];
  return redirect ? `${path}?to=${encodeURIComponent(redirect)}` : path;
}

const HIGHLIGHTS = [
  { icon: Sparkles, text: "Eşyanı hikâyesiyle birlikte satışa çıkar." },
  { icon: ShieldCheck, text: "Alıcılarla güvenli şekilde mesajlaş." },
];

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("to");
  const { login, register, status } = useAppData();

  const isSignUp = mode === "sign-up";

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  // Zaten girişliyse forma hiç uğratma.
  useEffect(() => {
    if (status === "authenticated") router.replace(safeRedirect(redirect));
  }, [status, router, redirect]);

  function validateField(field: Field): string | null {
    switch (field) {
      case "nickname":
        return isSignUp ? validateNickname(nickname) : null;
      case "email":
        return validateEmail(email);
      case "password":
        return isSignUp ? validatePassword(password) : password ? null : "Şifre gerekli.";
      case "passwordConfirm":
        if (!isSignUp) return null;
        if (!passwordConfirm) return "Şifreni tekrar gir.";
        return password !== passwordConfirm ? "Şifreler eşleşmiyor." : null;
      case "phone":
        // Telefon isteğe bağlı — yalnızca bir şey girilmişse biçimini doğrula.
        return isSignUp && phone.trim() ? validatePhone(phone, country) : null;
    }
  }

  function handleBlur(field: Field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field) ?? undefined }));
  }

  /** Alan düzeltilirken hatayı anında kaldır — sürekli kırmızı kalmasın. */
  function clearFieldError(field: Field) {
    setFormError(null);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const fields: Field[] = isSignUp
      ? ["nickname", "email", "password", "passwordConfirm", "phone"]
      : ["email", "password"];

    const nextErrors: FieldErrors<Field> = {};
    for (const field of fields) {
      const error = validateField(field);
      if (error) nextErrors[field] = error;
    }

    setErrors(nextErrors);
    setTouched(Object.fromEntries(fields.map((f) => [f, true])));

    if (Object.keys(nextErrors).length > 0) {
      setFormError(null);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const result = isSignUp
      ? await register({
          nickname,
          email,
          password,
          phone: phone.trim() ? toE164(phone, country) : undefined,
        })
      : await login({ email, password });

    if (!result.ok) {
      setSubmitting(false);
      // Form değerleri korunur; kullanıcı sadece hatayı düzeltip tekrar dener.
      setFormError(result.error ?? "İşlem tamamlanamadı.");
      return;
    }

    router.replace(safeRedirect(redirect));
  }

  const strength = isSignUp ? passwordStrength(password) : null;

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
      className="rounded-full px-2.5 py-1.5 font-heading text-[11px] font-bold text-text-secondary transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div className="flex min-h-[calc(100vh-68px)] items-center justify-center px-4 py-8 sm:px-6 md:min-h-[calc(100vh-80px)] md:py-12">
      <div className="grid w-full max-w-[1080px] overflow-hidden rounded-3xl border border-border bg-bg-card shadow-hover lg:grid-cols-[0.9fr_1.1fr]">
        {/* Sol panel — marka. Mobilde gizlenir, form tam genişliği alır. */}
        <div className="relative hidden overflow-hidden bg-[#4a1030] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5c1030] via-[#8a1745] to-[#d62162]" />
          <div
            aria-hidden
            className="animate-drift-slow absolute -top-20 -left-20 h-[340px] w-[340px] rounded-full bg-[#ff5fa2]/35 blur-[100px]"
          />
          <div
            aria-hidden
            className="animate-drift-slower absolute -right-24 -bottom-24 h-[380px] w-[380px] rounded-full bg-[#ffbfe4]/30 blur-[110px]"
          />

          <div className="relative">
            <Link href="/" className="mb-10 inline-block">
              <span className="font-serif text-[30px] font-bold tracking-[-1.2px] text-white lowercase">
                exift
              </span>
            </Link>

            <h2 className="mb-4 font-display text-[38px] leading-[1.1] font-bold tracking-[-0.5px]">
              {isSignUp ? "Aramıza katıl." : "Tekrar hoş geldin."}
            </h2>
            <p className="max-w-[34ch] text-[14.5px] leading-relaxed text-white/80">
              {isSignUp
                ? "Hesabını oluştur, eşyalarını hikâyesiyle birlikte satışa çıkar."
                : "Kaldığın yerden devam et; ilanların ve mesajların seni bekliyor."}
            </p>
          </div>

          <ul className="relative mt-12 flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-[13.5px] text-white/85">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  <Icon size={15} aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Sağ panel — form. */}
        <div className="p-6 sm:p-10 lg:p-12">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-text-secondary transition-colors hover:text-primary lg:hidden"
          >
            <ArrowLeft size={14} aria-hidden /> Ana Sayfa
          </Link>

          <div className="mb-7">
            <h1 className="mb-1.5 font-heading text-[26px] font-extrabold tracking-[-0.5px] text-text-main sm:text-[30px]">
              {isSignUp ? "Hesap oluştur" : "Hoş geldin"}
            </h1>
            <p className="text-[13.5px] text-text-secondary">
              {isSignUp
                ? "Birkaç adımda aramıza katıl."
                : "Hesabına giriş yap ve kaldığın yerden devam et."}
            </p>
          </div>

          <div className="mb-7 flex gap-1 rounded-full border border-border bg-bg-body p-1" role="tablist">
            {(["sign-in", "sign-up"] as const).map((tab) => (
              <Link
                key={tab}
                href={tabHref(tab, redirect)}
                role="tab"
                aria-selected={mode === tab}
                className={cn(
                  "flex-1 rounded-full py-2.5 text-center font-heading text-[13.5px] font-bold transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                  mode === tab
                    ? "bg-primary text-white shadow-[0_2px_8px_rgba(214,33,98,0.2)]"
                    : "text-text-secondary hover:text-text-main",
                )}
              >
                {tab === "sign-in" ? "Giriş Yap" : "Kayıt Ol"}
              </Link>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {formError && <InlineAlert variant="error">{formError}</InlineAlert>}

            {isSignUp && (
              <Input
                label="Kullanıcı adı"
                required
                autoComplete="username"
                placeholder="Seni nasıl görsünler?"
                leftIcon={<User size={16} />}
                value={nickname}
                error={touched.nickname ? errors.nickname : null}
                onChange={(e) => {
                  setNickname(e.target.value);
                  clearFieldError("nickname");
                }}
                onBlur={() => handleBlur("nickname")}
                disabled={submitting}
              />
            )}

            <Input
              label="E-posta"
              type="email"
              required
              autoComplete="email"
              placeholder="ornek@eposta.com"
              leftIcon={<AtSign size={16} />}
              value={email}
              error={touched.email ? errors.email : null}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              onBlur={() => handleBlur("email")}
              disabled={submitting}
            />

            <div>
              <Input
                label="Şifre"
                type={showPassword ? "text" : "password"}
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder={isSignUp ? "En az 6 karakter" : "Şifren"}
                leftIcon={<Lock size={16} />}
                value={password}
                error={touched.password ? errors.password : null}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                onBlur={() => handleBlur("password")}
                disabled={submitting}
                rightSlot={passwordToggle}
              />

              {isSignUp && password && strength && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1" aria-hidden>
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors duration-300",
                          i < strength.score
                            ? strength.score <= 1
                              ? "bg-red-400"
                              : strength.score === 2
                                ? "bg-amber-400"
                                : "bg-emerald-500"
                            : "bg-border",
                        )}
                      />
                    ))}
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-text-muted">
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {isSignUp && (
              <Input
                label="Şifre tekrar"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Şifreni tekrar gir"
                leftIcon={<Lock size={16} />}
                value={passwordConfirm}
                error={touched.passwordConfirm ? errors.passwordConfirm : null}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  clearFieldError("passwordConfirm");
                }}
                onBlur={() => handleBlur("passwordConfirm")}
                disabled={submitting}
              />
            )}

            {isSignUp && (
              <PhoneField
                country={country}
                onCountryChange={(c) => {
                  setCountry(c);
                  clearFieldError("phone");
                }}
                value={phone}
                onValueChange={(v) => {
                  setPhone(v);
                  clearFieldError("phone");
                }}
                onBlur={() => handleBlur("phone")}
                error={touched.phone ? errors.phone : null}
                disabled={submitting}
              />
            )}

            {!isSignUp && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-[12.5px] font-semibold text-primary transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  Şifremi unuttum
                </button>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={submitting}
              className="mt-1"
              leftIcon={isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />}
            >
              {submitting
                ? isSignUp
                  ? "Hesabın oluşturuluyor..."
                  : "Giriş yapılıyor..."
                : isSignUp
                  ? "Kayıt Ol"
                  : "Giriş Yap"}
            </Button>
          </form>

          <p className="mt-6 text-center text-[12.5px] text-text-secondary">
            {isSignUp ? "Zaten hesabın var mı? " : "Henüz hesabın yok mu? "}
            <Link
              href={tabHref(isSignUp ? "sign-in" : "sign-up", redirect)}
              className="font-heading font-bold text-primary hover:underline"
            >
              {isSignUp ? "Giriş Yap" : "Kayıt Ol"}
            </Link>
          </p>

          {isSignUp && (
            <p className="mt-5 text-center text-[11.5px] leading-relaxed text-text-muted">
              Kayıt olarak{" "}
              <Link href="/kullanim-kosullari" className="font-semibold hover:text-primary">
                Kullanım Koşulları
              </Link>{" "}
              ve{" "}
              <Link href="/gizlilik-politikasi" className="font-semibold hover:text-primary">
                Gizlilik Politikası
              </Link>
              &apos;nı kabul etmiş olursun.
            </p>
          )}
        </div>
      </div>

      {/*
        Otomatik şifre sıfırlama backend'de YOK (bkz. docs/missing-services/AUTH.md).
        Çalışmayan bir bağlantı koymak yerine gerçek bir yol sunuluyor: destek
        e-postası. Servis geldiğinde burası bir forma dönüşecek.
      */}
      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Şifreni mi unuttun?"
        description="Otomatik şifre sıfırlama henüz hazır değil. Hesabına erişimini geri kazanman için destek ekibimiz sana yardımcı olacak."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForgotOpen(false)}>
              Kapat
            </Button>
            <Button
              onClick={() => {
                window.location.href = `mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(
                  "Şifre sıfırlama talebi",
                )}&body=${encodeURIComponent(
                  "Merhaba,\n\nHesabımın şifresini sıfırlamak istiyorum.\n\nKayıtlı e-posta adresim: ",
                )}`;
                setForgotOpen(false);
              }}
            >
              Destek&apos;e Yaz
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-text-secondary">
          Talebini{" "}
          <span className="font-semibold text-text-main">{siteConfig.contact.email}</span> adresine
          ilettiğinde en kısa sürede dönüş yapıyoruz.
        </p>
      </Modal>
    </div>
  );
}
