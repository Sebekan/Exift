/**
 * Form doğrulama kuralları. Sınırlar backend ile birebir eşleşir; amaç
 * kullanıcıya anında geri bildirim vermek, sunucu doğrulamasını değiştirmek değil.
 */

export const LIMITS = {
  nicknameMin: 3,
  nicknameMax: 30,
  passwordMin: 6,
  bioMax: 300,
  titleMin: 3,
  titleMax: 200,
  storyMin: 50,
  priceMax: 10_000_000,
  commentMax: 1000,
  messageMax: 2000,
  maxImages: 8,
} as const;

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "E-posta adresi gerekli.";
  if (!EMAIL_PATTERN.test(trimmed)) return "Geçerli bir e-posta adresi gir.";
  return null;
}

export function validateNickname(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Kullanıcı adı gerekli.";
  if (trimmed.length < LIMITS.nicknameMin) {
    return `Kullanıcı adı en az ${LIMITS.nicknameMin} karakter olmalı.`;
  }
  if (trimmed.length > LIMITS.nicknameMax) {
    return `Kullanıcı adı en fazla ${LIMITS.nicknameMax} karakter olabilir.`;
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Şifre gerekli.";
  if (value.length < LIMITS.passwordMin) {
    return `Şifre en az ${LIMITS.passwordMin} karakter olmalı.`;
  }
  return null;
}

/** 0–4 arası kaba bir şifre gücü göstergesi. */
export function passwordStrength(value: string): { score: number; label: string } {
  if (!value) return { score: 0, label: "" };
  let score = 0;
  if (value.length >= 6) score++;
  if (value.length >= 10) score++;
  if (/[A-ZÇĞİÖŞÜ]/.test(value) && /[a-zçğıöşü]/.test(value)) score++;
  if (/\d/.test(value) || /[^\w\s]/.test(value)) score++;

  const labels = ["Çok zayıf", "Zayıf", "Orta", "İyi", "Güçlü"];
  return { score, label: labels[score] };
}

export function validateTitle(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "İlan başlığı gerekli.";
  if (trimmed.length < LIMITS.titleMin) {
    return `Başlık en az ${LIMITS.titleMin} karakter olmalı.`;
  }
  if (trimmed.length > LIMITS.titleMax) {
    return `Başlık en fazla ${LIMITS.titleMax} karakter olabilir.`;
  }
  return null;
}

export function validateStory(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < LIMITS.storyMin) {
    return `Hikâyeyi biraz daha anlat — en az ${LIMITS.storyMin} karakter.`;
  }
  return null;
}

export function validatePrice(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Fiyat gerekli.";
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return "Fiyat sayı olmalı.";
  if (parsed < 0) return "Fiyat negatif olamaz.";
  if (parsed > LIMITS.priceMax) return "Fiyat çok yüksek.";
  return null;
}

export function validateBio(value: string): string | null {
  if (value.length > LIMITS.bioMax) {
    return `Biyografi en fazla ${LIMITS.bioMax} karakter olabilir.`;
  }
  return null;
}

/** Hata nesnesinde dolu alan var mı. */
export function hasErrors<T extends string>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some(Boolean);
}
