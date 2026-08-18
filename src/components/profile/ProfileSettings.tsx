"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { Bell, Lock, Mail, Save, ShieldCheck, Trash2 } from "lucide-react";
import type { UserProfile } from "@/types";
import { toUserMessage } from "@/lib/api/errors";
import { authService } from "@/services";
import { DEFAULT_COUNTRY, findCountry, toE164, validatePhone, type Country } from "@/lib/phone";
import {
  LIMITS,
  validateBio,
  validateNickname,
  validatePassword,
  type FieldErrors,
} from "@/lib/validation";
import { useResettableState } from "@/hooks/useResettableState";
import { useAppData } from "@/context/AppDataContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { InlineAlert } from "@/components/ui/States";
import { PhoneField } from "@/components/auth/PhoneField";

/** Kayıtlı E.164 numarayı ülke + ulusal parçaya böler. */
function splitPhone(phone: string | null): { country: Country; national: string } {
  if (!phone) return { country: DEFAULT_COUNTRY, national: "" };
  const country = findCountry(
    // En uzun eşleşen ülke kodunu bul ("+1" ile "+90" karışmasın).
    ["+994", "+90", "+49", "+44", "+31", "+33", "+1"].find((d) => phone.startsWith(d)) ?? "+90",
  );
  return { country, national: phone.slice(country.dial.length) };
}

export function ProfileSettings({ profile }: { profile: UserProfile }) {
  const { updateProfile } = useAppData();
  const { showToast } = useToast();

  const initialPhone = useMemo(() => splitPhone(profile.phone), [profile.phone]);

  /* ------------------------------ profil ------------------------------ */

  /**
   * Form yalnızca sunucudaki kanonik değerler değiştiğinde sıfırlanır. Avatar
   * yüklemesi `profile` nesnesinin kimliğini değiştirir ama bu alanlara
   * dokunmaz — kullanıcı yazarken metnin silinmemesi için anahtar bu üç alandan
   * türetiliyor.
   */
  const formKey = `${profile.nickname}|${profile.bio}|${profile.phone ?? ""}`;

  const [nickname, setNickname] = useResettableState(
    formKey,
    useCallback(() => profile.nickname, [profile.nickname]),
  );
  const [bio, setBio] = useResettableState(
    formKey,
    useCallback(() => profile.bio, [profile.bio]),
  );
  const [country, setCountry] = useResettableState<Country>(
    formKey,
    useCallback(() => initialPhone.country, [initialPhone.country]),
  );
  const [phone, setPhone] = useResettableState(
    formKey,
    useCallback(() => initialPhone.national, [initialPhone.national]),
  );

  const [errors, setErrors] = useState<FieldErrors<"nickname" | "bio" | "phone">>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isDirty =
    nickname !== profile.nickname ||
    bio !== profile.bio ||
    toE164(phone, country) !== (profile.phone ?? "");

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;

    const nextErrors: FieldErrors<"nickname" | "bio" | "phone"> = {
      nickname: validateNickname(nickname) ?? undefined,
      bio: validateBio(bio) ?? undefined,
      phone: phone ? (validatePhone(phone, country) ?? undefined) : undefined,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSaving(true);
    setFormError(null);

    // Yalnızca değişen alanları gönder.
    const result = await updateProfile({
      ...(nickname !== profile.nickname && { nickname }),
      ...(bio !== profile.bio && { bio }),
      ...(phone && toE164(phone, country) !== profile.phone && { phone: toE164(phone, country) }),
    });

    setSaving(false);
    if (result.ok) showToast("Profilin güncellendi.");
    else setFormError(result.error ?? "Profil güncellenemedi.");
  }

  /* ------------------------------ şifre ------------------------------- */

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<
    FieldErrors<"current" | "next" | "confirm">
  >({});
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordFormError, setPasswordFormError] = useState<string | null>(null);

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    if (changingPassword) return;

    const nextErrors: FieldErrors<"current" | "next" | "confirm"> = {
      current: currentPassword ? undefined : "Mevcut şifreni gir.",
      next: validatePassword(newPassword) ?? undefined,
      confirm: newPassword !== confirmPassword ? "Şifreler eşleşmiyor." : undefined,
    };
    setPasswordErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setChangingPassword(true);
    setPasswordFormError(null);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Şifren başarıyla değiştirildi.");
    } catch (error) {
      setPasswordFormError(toUserMessage(error, "Şifre değiştirilemedi."));
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* --------------------------- Profil bilgileri --------------------------- */}
      <form
        onSubmit={handleProfileSubmit}
        noValidate
        className="rounded-3xl border border-border bg-bg-card p-6 shadow-card sm:p-7"
      >
        <h2 className="mb-5 border-b border-border pb-3 font-heading text-[15px] font-bold text-text-main">
          Profil bilgileri
        </h2>

        <div className="flex flex-col gap-5">
          {formError && <InlineAlert variant="error">{formError}</InlineAlert>}

          <Input
            label="Kullanıcı adı"
            required
            value={nickname}
            maxLength={LIMITS.nicknameMax}
            counter={`${nickname.length}/${LIMITS.nicknameMax}`}
            error={errors.nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setErrors((p) => ({ ...p, nickname: undefined }));
              setFormError(null);
            }}
            disabled={saving}
          />

          <Textarea
            label="Hakkımda"
            rows={3}
            placeholder="Kendinden kısaca bahset..."
            value={bio}
            maxLength={LIMITS.bioMax}
            counter={`${bio.length}/${LIMITS.bioMax}`}
            error={errors.bio}
            onChange={(e) => {
              setBio(e.target.value);
              setErrors((p) => ({ ...p, bio: undefined }));
            }}
            disabled={saving}
          />

          <PhoneField
            country={country}
            onCountryChange={(c) => {
              setCountry(c);
              setErrors((p) => ({ ...p, phone: undefined }));
            }}
            value={phone}
            onValueChange={(v) => {
              setPhone(v);
              setErrors((p) => ({ ...p, phone: undefined }));
            }}
            error={errors.phone}
            disabled={saving}
          />

          {/* E-posta backend'de değiştirilemiyor — düzenlenebilir gibi göstermiyoruz. */}
          <div>
            <span className="mb-2 block font-heading text-[13px] font-bold text-text-main">
              E-posta
            </span>
            <div className="flex h-12 items-center gap-2.5 rounded-2xl border border-border bg-bg-body px-4 text-[14px] text-text-secondary">
              <Mail size={15} className="shrink-0 text-text-muted" aria-hidden />
              <span className="truncate">{profile.email}</span>
            </div>
            <p className="mt-1.5 text-[12px] text-text-muted">
              E-posta adresi şu an değiştirilemiyor.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={saving}
              disabled={!isDirty}
              leftIcon={<Save size={15} />}
              className="min-w-[180px]"
            >
              Değişiklikleri Kaydet
            </Button>
          </div>
        </div>
      </form>

      {/* ------------------------------ Güvenlik ------------------------------ */}
      <form
        onSubmit={handlePasswordSubmit}
        noValidate
        className="rounded-3xl border border-border bg-bg-card p-6 shadow-card sm:p-7"
      >
        <h2 className="mb-5 flex items-center gap-2 border-b border-border pb-3 font-heading text-[15px] font-bold text-text-main">
          <ShieldCheck size={16} className="text-primary" aria-hidden /> Güvenlik
        </h2>

        <div className="flex flex-col gap-5">
          {passwordFormError && <InlineAlert variant="error">{passwordFormError}</InlineAlert>}

          <Input
            label="Mevcut şifren"
            type="password"
            autoComplete="current-password"
            leftIcon={<Lock size={16} />}
            value={currentPassword}
            error={passwordErrors.current}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setPasswordErrors((p) => ({ ...p, current: undefined }));
              setPasswordFormError(null);
            }}
            disabled={changingPassword}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Yeni şifre"
              type="password"
              autoComplete="new-password"
              placeholder={`En az ${LIMITS.passwordMin} karakter`}
              value={newPassword}
              error={passwordErrors.next}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordErrors((p) => ({ ...p, next: undefined }));
              }}
              disabled={changingPassword}
            />
            <Input
              label="Yeni şifre (tekrar)"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              error={passwordErrors.confirm}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordErrors((p) => ({ ...p, confirm: undefined }));
              }}
              disabled={changingPassword}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="secondary"
              loading={changingPassword}
              disabled={!currentPassword || !newPassword}
              className="min-w-[180px]"
            >
              Şifreyi Değiştir
            </Button>
          </div>
        </div>
      </form>

      {/* ------------------------------- Hesap -------------------------------- */}
      <section className="rounded-3xl border border-border bg-bg-card p-6 shadow-card sm:p-7">
        <h2 className="mb-5 border-b border-border pb-3 font-heading text-[15px] font-bold text-text-main">
          Hesap
        </h2>

        <div className="flex items-start gap-3 rounded-2xl border border-border bg-bg-body p-4">
          <Trash2 size={16} className="mt-0.5 shrink-0 text-text-muted" aria-hidden />
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-text-main">Hesabımı sil</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-text-secondary">
              Hesap silme talebi için{" "}
              <a
                href="mailto:exift.official@gmail.com?subject=Hesap%20silme%20talebi"
                className="font-semibold text-primary hover:underline"
              >
                exift.official@gmail.com
              </a>{" "}
              adresine yazabilirsin. (Otomatik silme henüz sunulmuyor.)
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-bg-body p-4">
          <Bell size={16} className="mt-0.5 shrink-0 text-text-muted" aria-hidden />
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-text-main">Bildirim tercihleri</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-text-secondary">
              Bildirim ayarları yakında. Şimdilik tüm sohbet bildirimleri uygulama içinde gösteriliyor.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
