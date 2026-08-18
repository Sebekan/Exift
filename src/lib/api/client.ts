import { ApiError, extractDetail, kindFromStatus } from "./errors";

// Sondaki "/" temizlenir: yapılandırma "https://api.example.com/" biçiminde
// verildiğinde yol birleştirmesi "…com//api/products/" gibi çift eğik çizgi
// üretiyordu. Bazı sunucular/proxy'ler bunu 404'e çeviriyor.
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const TOKEN_KEY = "exift-token";
const DEFAULT_TIMEOUT_MS = 20_000;

/* ------------------------------------------------------------------ */
/* Token deposu                                                        */
/* ------------------------------------------------------------------ */

/**
 * Token localStorage'da tutulur. Bu bilinçli bir ödünleşim: backend cookie
 * tabanlı oturum sunmuyor (JWT'yi response body'de dönüyor). httpOnly cookie'ye
 * geçiş için gereken backend değişikliği docs/missing-services/AUTH.md'de.
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private mode / kota — oturum yalnızca bu sekmede yaşar */
  }
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* yoksayılır */
  }
}

export function hasToken(): boolean {
  return getToken() !== null;
}

/* ------------------------------------------------------------------ */
/* 401 aboneliği                                                       */
/* ------------------------------------------------------------------ */

type UnauthorizedHandler = () => void;
const unauthorizedHandlers = new Set<UnauthorizedHandler>();

/**
 * Token süresi dolduğunda (401) AppData context'i haberdar etmek için.
 * Böylece client, React'e doğrudan bağımlı olmadan oturumu düşürebilir.
 */
export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
}

function notifyUnauthorized(): void {
  clearToken();
  unauthorizedHandlers.forEach((handler) => handler());
}

/* ------------------------------------------------------------------ */
/* İstek katmanı                                                       */
/* ------------------------------------------------------------------ */

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Sayfa değişince isteği iptal etmek için. */
  signal?: AbortSignal;
  /** `true` ise 401 alındığında oturum düşürülmez (örn. login denemesi). */
  skipAuthRedirect?: boolean;
  timeoutMs?: number;
}

function buildUrl(path: string, query?: QueryParams): string {
  const url = `${API_BASE}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

async function parseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  return res.json().catch(() => null);
}

async function send<T>(path: string, options: RequestOptions = {}, query?: QueryParams): Promise<T> {
  const { method = "GET", body, signal, skipAuthRedirect = false, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // Çağıranın sinyali ile timeout sinyalini birleştir.
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
  const signals = signal ? [signal, timeoutController.signal] : [timeoutController.signal];

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.any(signals),
    });
  } catch (error) {
    // Çağıran bilinçli iptal ettiyse hatayı olduğu gibi yukarı ver.
    if (signal?.aborted) throw error;
    if (timeoutController.signal.aborted) {
      throw new ApiError(0, "timeout", "İstek zaman aşımına uğradı.");
    }
    throw new ApiError(0, "network", "Sunucuya ulaşılamadı.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const parsed = await parseBody(res);
    const detail = extractDetail(parsed);
    const kind = kindFromStatus(res.status);

    if (kind === "unauthorized" && !skipAuthRedirect) notifyUnauthorized();

    throw new ApiError(res.status, kind, detail ?? `İstek başarısız (${res.status}).`, detail);
  }

  if (res.status === 204) return undefined as T;
  return (await parseBody(res)) as T;
}

/* ------------------------------------------------------------------ */
/* Genel API                                                           */
/* ------------------------------------------------------------------ */

export const http = {
  get: <T>(path: string, query?: QueryParams, options?: RequestOptions) =>
    send<T>(path, { ...options, method: "GET" }, query),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    send<T>(path, { ...options, method: "POST", body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    send<T>(path, { ...options, method: "PUT", body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    send<T>(path, { ...options, method: "DELETE" }),

  /** multipart/form-data — Content-Type'ı tarayıcı boundary ile kendisi kurar. */
  async upload<T>(path: string, formData: FormData, options: RequestOptions = {}): Promise<T> {
    const { signal, timeoutMs = 60_000 } = options; // yükleme daha uzun sürebilir
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
    const signals = signal ? [signal, timeoutController.signal] : [timeoutController.signal];

    let res: Response;
    try {
      res = await fetch(buildUrl(path), {
        method: "POST",
        headers,
        body: formData,
        signal: AbortSignal.any(signals),
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      if (timeoutController.signal.aborted) {
        throw new ApiError(0, "timeout", "Yükleme zaman aşımına uğradı.");
      }
      throw new ApiError(0, "network", "Sunucuya ulaşılamadı.");
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const detail = extractDetail(await parseBody(res));
      const kind = kindFromStatus(res.status);
      if (kind === "unauthorized") notifyUnauthorized();
      throw new ApiError(res.status, kind, detail ?? "Yükleme başarısız.", detail);
    }

    return (await parseBody(res)) as T;
  },
};
