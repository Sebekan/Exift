import { clearToken, hasToken, http, setToken } from "@/lib/api/client";
import type { ApiAuthResponse, ApiUser, ApiUserUpdateRequest } from "@/lib/api/types";
import type { UserProfile } from "@/types";
import { toUserProfile } from "./mappers";

export interface RegisterInput {
  nickname: string;
  email: string;
  password: string;
  /** E.164 biçiminde: "+905551112233". İsteğe bağlı. */
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ProfileUpdateInput {
  nickname?: string;
  bio?: string;
  avatarUrl?: string | null;
  phone?: string;
}

export const authService = {
  async register(input: RegisterInput): Promise<UserProfile> {
    const data = await http.post<ApiAuthResponse>(
      "/api/auth/register",
      {
        nickname: input.nickname.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
        ...(input.phone ? { phone: input.phone } : {}),
      },
      { skipAuthRedirect: true },
    );
    setToken(data.access_token);
    return toUserProfile(data.user);
  },

  async login(input: LoginInput): Promise<UserProfile> {
    const data = await http.post<ApiAuthResponse>(
      "/api/auth/login",
      { email: input.email.trim().toLowerCase(), password: input.password },
      { skipAuthRedirect: true },
    );
    setToken(data.access_token);
    return toUserProfile(data.user);
  },

  async getMe(signal?: AbortSignal): Promise<UserProfile> {
    const user = await http.get<ApiUser>("/api/auth/me", undefined, {
      // Oturum geri yüklemede 401 beklenen bir sonuç; global çıkışı tetiklemesin.
      skipAuthRedirect: true,
      signal,
    });
    return toUserProfile(user);
  },

  async updateProfile(input: ProfileUpdateInput): Promise<UserProfile> {
    const body: ApiUserUpdateRequest = {};
    if (input.nickname !== undefined) body.nickname = input.nickname.trim();
    if (input.bio !== undefined) body.bio = input.bio;
    // null → avatarı kaldır (backend boş string'i null'a çevirir).
    if (input.avatarUrl !== undefined) body.avatar_url = input.avatarUrl ?? "";
    if (input.phone !== undefined) body.phone = input.phone;

    const user = await http.put<ApiUser>("/api/auth/me", body);
    return toUserProfile(user);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await http.post("/api/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  /** E-posta doğrulama bağlantısındaki token'ı doğrular. */
  async verifyEmail(token: string): Promise<UserProfile> {
    const user = await http.post<ApiUser>("/api/auth/verify-email", { token });
    return toUserProfile(user);
  },

  logout(): void {
    clearToken();
  },

  hasSession(): boolean {
    return hasToken();
  },
};
