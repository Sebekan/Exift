/**
 * Telefon numarası girişi. Backend `phonenumbers` ile doğrulayıp E.164
 * biçiminde saklıyor (backend/app/utils/phone.py) — bu modül aynı biçimi
 * istemcide üretir ki kullanıcı hatayı sunucuya gitmeden görsün.
 *
 * Frontend ricası doğrultusunda ülke kodu ayrı seçilir, numara ayrı girilir ve
 * ikisi birleştirilerek gönderilir.
 */

export interface Country {
  code: string;
  /** Ülke telefon kodu, "+" dahil. */
  dial: string;
  label: string;
  flag: string;
  /** Ülke kodu hariç beklenen hane sayısı. */
  nationalDigits: number;
  /** Kullanıcıya gösterilen örnek biçim. */
  placeholder: string;
}

export const COUNTRIES: Country[] = [
  { code: "TR", dial: "+90", label: "Türkiye", flag: "🇹🇷", nationalDigits: 10, placeholder: "5xx xxx xx xx" },
  { code: "DE", dial: "+49", label: "Almanya", flag: "🇩🇪", nationalDigits: 11, placeholder: "15x xxxxxxxx" },
  { code: "GB", dial: "+44", label: "Birleşik Krallık", flag: "🇬🇧", nationalDigits: 10, placeholder: "7xxx xxxxxx" },
  { code: "NL", dial: "+31", label: "Hollanda", flag: "🇳🇱", nationalDigits: 9, placeholder: "6 xxxxxxxx" },
  { code: "FR", dial: "+33", label: "Fransa", flag: "🇫🇷", nationalDigits: 9, placeholder: "6 xx xx xx xx" },
  { code: "US", dial: "+1", label: "ABD / Kanada", flag: "🇺🇸", nationalDigits: 10, placeholder: "xxx xxx xxxx" },
  { code: "AZ", dial: "+994", label: "Azerbaycan", flag: "🇦🇿", nationalDigits: 9, placeholder: "xx xxx xx xx" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function findCountry(dial: string): Country {
  return COUNTRIES.find((c) => c.dial === dial) ?? DEFAULT_COUNTRY;
}

/** Girilen metinden yalnızca rakamları alır. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Ulusal numarayı normalize eder. TR için kullanıcıların alışkanlıkla yazdığı
 * baştaki 0'ı ("0532...") temizler.
 */
export function normalizeNational(raw: string, country: Country): string {
  let digits = digitsOnly(raw);
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  // Ülke kodunu numaranın içine yazdıysa ("905321234567") baştaki kodu ayıkla.
  const dialDigits = country.dial.slice(1);
  if (digits.length > country.nationalDigits && digits.startsWith(dialDigits)) {
    digits = digits.slice(dialDigits.length);
  }
  return digits.slice(0, country.nationalDigits);
}

/** Yazarken okunabilirlik için gruplar: "532 123 45 67". */
export function formatNationalDisplay(raw: string, country: Country): string {
  const digits = normalizeNational(raw, country);
  if (country.code !== "TR") return digits;

  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)];
  return parts.filter(Boolean).join(" ");
}

/** Backend'e gönderilecek E.164 değeri: "+905321234567". */
export function toE164(national: string, country: Country): string {
  return `${country.dial}${normalizeNational(national, country)}`;
}

/** Geçerliyse null, değilse Türkçe hata mesajı döner. */
export function validatePhone(national: string, country: Country): string | null {
  const digits = normalizeNational(national, country);
  if (digits.length === 0) return "Telefon numarası gerekli.";
  if (digits.length < country.nationalDigits) {
    return `Numara eksik görünüyor (${country.nationalDigits} hane olmalı).`;
  }
  if (country.code === "TR" && !digits.startsWith("5")) {
    return "Lütfen bir cep telefonu numarası gir (5 ile başlamalı).";
  }
  return null;
}
