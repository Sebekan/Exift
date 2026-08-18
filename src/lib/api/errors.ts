/**
 * Tek hata tipi + tek çeviri noktası. Bileşenler ham backend/network hatası
 * görmez; her zaman `toUserMessage` üzerinden geçmiş Türkçe metin gösterir.
 */

export type ApiErrorKind =
  | "validation" // 400 / 422
  | "unauthorized" // 401
  | "forbidden" // 403
  | "not_found" // 404
  | "conflict" // 409
  | "rate_limited" // 429
  | "server" // 5xx
  | "network" // bağlantı yok
  | "timeout" // istek zaman aşımı
  | "unknown";

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  /** Backend'in `detail` alanı — varsa kullanıcıya doğrudan gösterilebilir. */
  readonly detail: string | null;

  constructor(status: number, kind: ApiErrorKind, message: string, detail: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = kind;
    this.detail = detail;
  }
}

export function kindFromStatus(status: number): ApiErrorKind {
  if (status === 400 || status === 422) return "validation";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server";
  return "unknown";
}

/** Backend `detail` vermediğinde kullanılan genel mesajlar. */
const FALLBACK_MESSAGES: Record<ApiErrorKind, string> = {
  validation: "Girdiğin bilgileri kontrol eder misin?",
  unauthorized: "Oturumun sona ermiş. Lütfen tekrar giriş yap.",
  forbidden: "Bu işlem için yetkin yok.",
  not_found: "Aradığın içerik bulunamadı.",
  conflict: "Bu kayıt zaten mevcut.",
  rate_limited: "Çok fazla deneme yaptın. Lütfen biraz bekle.",
  server: "Sunucuda bir sorun oluştu. Lütfen birazdan tekrar dene.",
  network: "İnternet bağlantına ulaşamadık. Bağlantını kontrol edip tekrar dene.",
  timeout: "İstek zaman aşımına uğradı. Lütfen tekrar dene.",
  unknown: "Beklenmedik bir hata oluştu. Lütfen tekrar dene.",
};

/**
 * FastAPI `detail` alanı üç biçimde gelebilir:
 *   - string                          → HTTPException(detail="...")
 *   - [{ msg, loc }]                  → Pydantic doğrulama hatası (422)
 *   - object                          → beklenmeyen; yok sayılır
 */
export function extractDetail(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const detail = (body as { detail?: unknown }).detail;

  if (typeof detail === "string") return detail.trim() || null;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const msg = (item as { msg?: unknown }).msg;
        return typeof msg === "string" ? msg : null;
      })
      .filter((m): m is string => Boolean(m));
    return messages.length > 0 ? messages[0] : null;
  }

  return null;
}

/**
 * Her yerde gösterilecek nihai kullanıcı mesajı. Bileşenler `error.message`
 * yerine bunu çağırmalı — böylece hata metinleri tek yerden yönetilir.
 */
export function toUserMessage(error: unknown, fallback?: string): string {
  if (error instanceof ApiError) {
    // Backend'in Türkçe `detail` mesajları zaten kullanıcıya uygun.
    if (error.detail) return error.detail;
    return fallback ?? FALLBACK_MESSAGES[error.kind];
  }
  if (error instanceof Error && error.name === "AbortError") {
    return FALLBACK_MESSAGES.timeout;
  }
  return fallback ?? FALLBACK_MESSAGES.unknown;
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.kind === "unauthorized";
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.kind === "not_found";
}
