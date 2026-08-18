"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { onUnauthorized } from "@/lib/api/client";
import { toUserMessage } from "@/lib/api/errors";
import { authService, chatService, listingService } from "@/services";
import type { LoginInput, ProfileUpdateInput, RegisterInput } from "@/services";
import type { ChatSummary, Product, UserProfile } from "@/types";

/**
 * Oturum + kullanıcıya özel koleksiyonlar (favoriler, sohbetler, kendi ilanları)
 * burada tutulur. Ürün listeleri sayfaya özel olduğu için burada TUTULMAZ —
 * her sayfa kendi verisini `listingService` üzerinden çeker. Bu, eski sürümdeki
 * "tüm ürünleri global state'e doldur" yaklaşımının yarattığı bayat veri ve
 * gereksiz istek sorununu ortadan kaldırır.
 */

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AppDataContextValue {
  /* oturum */
  status: AuthStatus;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  login: (input: LoginInput) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  logout: () => void;
  updateProfile: (input: ProfileUpdateInput) => Promise<AuthResult>;

  /* favoriler */
  favoriteIds: ReadonlySet<string>;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<boolean | null>;

  /* beğeniler */
  likedIds: ReadonlySet<string>;
  isLiked: (productId: string) => boolean;
  toggleLike: (productId: string) => Promise<{ liked: boolean; likesCount: number } | null>;

  /* kendi ilanları */
  myListings: Product[];
  myListingsLoading: boolean;
  refreshMyListings: () => Promise<void>;
  /** Bir ilan silindiğinde/eklendiğinde önbelleği güncel tutar. */
  removeMyListing: (productId: string) => void;
  upsertMyListing: (product: Product) => void;

  /* sohbetler */
  chats: ChatSummary[];
  refreshChats: () => Promise<void>;
  contactSeller: (productId: string) => Promise<string | null>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<string>>(new Set());
  const [likedIds, setLikedIds] = useState<ReadonlySet<string>>(new Set());
  const [myListings, setMyListings] = useState<Product[]>([]);
  const [myListingsLoading, setMyListingsLoading] = useState(false);
  const [chats, setChats] = useState<ChatSummary[]>([]);

  const isAuthenticated = status === "authenticated";

  /** Oturuma bağlı her şeyi temizler. */
  const resetSession = useCallback(() => {
    setProfile(null);
    setFavoriteIds(new Set());
    setLikedIds(new Set());
    setMyListings([]);
    setChats([]);
    setStatus("anonymous");
  }, []);

  /* ---------------------------------------------------------------- */
  /* Kullanıcıya özel verilerin yüklenmesi                             */
  /* ---------------------------------------------------------------- */

  const loadUserData = useCallback(async (signal?: AbortSignal) => {
    // Üçü birbirinden bağımsız — paralel çekilir, biri patlarsa diğerleri durmaz.
    const [favorites, mine, chatList] = await Promise.allSettled([
      listingService.listFavorites(signal),
      listingService.listMine(signal),
      chatService.list(signal),
    ]);

    if (favorites.status === "fulfilled") {
      setFavoriteIds(new Set(favorites.value.map((p) => p.id)));
      // Favori listesi beğeni durumunu da taşır.
      setLikedIds((prev) => {
        const next = new Set(prev);
        favorites.value.forEach((p) => (p.isLiked ? next.add(p.id) : next.delete(p.id)));
        return next;
      });
    }
    if (mine.status === "fulfilled") setMyListings(mine.value);
    if (chatList.status === "fulfilled") setChats(chatList.value);
  }, []);

  /* ---------------------------------------------------------------- */
  /* Oturum geri yükleme                                               */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const controller = new AbortController();

    async function restore() {
      if (!authService.hasSession()) {
        setStatus("anonymous");
        return;
      }
      try {
        const user = await authService.getMe(controller.signal);
        if (controller.signal.aborted) return;
        setProfile(user);
        setStatus("authenticated");
        await loadUserData(controller.signal);
      } catch {
        if (controller.signal.aborted) return;
        // Token geçersiz/süresi dolmuş — sessizce anonim moda düş.
        authService.logout();
        resetSession();
      }
    }

    restore();
    return () => controller.abort();
  }, [loadUserData, resetSession]);

  /* Token herhangi bir istekte 401 alırsa oturumu düşür. */
  useEffect(() => onUnauthorized(resetSession), [resetSession]);

  /* ---------------------------------------------------------------- */
  /* Kimlik doğrulama                                                  */
  /* ---------------------------------------------------------------- */

  const login = useCallback(
    async (input: LoginInput): Promise<AuthResult> => {
      try {
        const user = await authService.login(input);
        setProfile(user);
        setStatus("authenticated");
        await loadUserData();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: toUserMessage(error, "Giriş yapılamadı.") };
      }
    },
    [loadUserData],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<AuthResult> => {
      try {
        const user = await authService.register(input);
        setProfile(user);
        setStatus("authenticated");
        await loadUserData();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: toUserMessage(error, "Kayıt oluşturulamadı.") };
      }
    },
    [loadUserData],
  );

  const logout = useCallback(() => {
    authService.logout();
    resetSession();
  }, [resetSession]);

  const updateProfile = useCallback(async (input: ProfileUpdateInput): Promise<AuthResult> => {
    try {
      const user = await authService.updateProfile(input);
      setProfile(user);
      return { ok: true };
    } catch (error) {
      // Eski davranış hatayı yutup yerel state'i güncelliyordu; artık gerçek
      // sonuç döner, böylece form kullanıcıya doğru geri bildirim verebilir.
      return { ok: false, error: toUserMessage(error, "Profil güncellenemedi.") };
    }
  }, []);

  /* ---------------------------------------------------------------- */
  /* Favori / beğeni                                                   */
  /* ---------------------------------------------------------------- */

  const isFavorite = useCallback((id: string) => favoriteIds.has(id), [favoriteIds]);
  const isLiked = useCallback((id: string) => likedIds.has(id), [likedIds]);

  // Aynı ilana üst üste tıklamada isteklerin yarışmasını engeller.
  const pendingFavorites = useRef(new Set<string>());

  const toggleFavorite = useCallback(async (productId: string): Promise<boolean | null> => {
    if (pendingFavorites.current.has(productId)) return null;
    pendingFavorites.current.add(productId);

    // İyimser güncelleme: UI anında tepki versin.
    const wasFavorite = favoriteIds.has(productId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorite) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      const favorited = await listingService.toggleFavorite(productId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (favorited) next.add(productId);
        else next.delete(productId);
        return next;
      });
      return favorited;
    } catch {
      // Başarısızsa iyimser değişikliği geri al.
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.add(productId);
        else next.delete(productId);
        return next;
      });
      return null;
    } finally {
      pendingFavorites.current.delete(productId);
    }
  }, [favoriteIds]);

  const pendingLikes = useRef(new Set<string>());

  const toggleLike = useCallback(async (productId: string) => {
    if (pendingLikes.current.has(productId)) return null;
    pendingLikes.current.add(productId);

    const wasLiked = likedIds.has(productId);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      const res = await listingService.toggleLike(productId);
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (res.liked) next.add(productId);
        else next.delete(productId);
        return next;
      });
      return res;
    } catch {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(productId);
        else next.delete(productId);
        return next;
      });
      return null;
    } finally {
      pendingLikes.current.delete(productId);
    }
  }, [likedIds]);

  /* ---------------------------------------------------------------- */
  /* Kendi ilanları                                                    */
  /* ---------------------------------------------------------------- */

  const refreshMyListings = useCallback(async () => {
    if (!authService.hasSession()) return;
    setMyListingsLoading(true);
    try {
      setMyListings(await listingService.listMine());
    } catch {
      /* profil sayfası hata durumunu kendi içinde gösterir */
    } finally {
      setMyListingsLoading(false);
    }
  }, []);

  const removeMyListing = useCallback((productId: string) => {
    setMyListings((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const upsertMyListing = useCallback((product: Product) => {
    setMyListings((prev) => {
      const index = prev.findIndex((p) => p.id === product.id);
      if (index === -1) return [product, ...prev];
      const next = [...prev];
      next[index] = product;
      return next;
    });
  }, []);

  /* ---------------------------------------------------------------- */
  /* Sohbetler                                                         */
  /* ---------------------------------------------------------------- */

  const refreshChats = useCallback(async () => {
    if (!authService.hasSession()) return;
    try {
      setChats(await chatService.list());
    } catch {
      /* sessiz — sohbet listesi ikincil veridir */
    }
  }, []);

  const contactSeller = useCallback(async (productId: string): Promise<string | null> => {
    try {
      const chat = await chatService.contactSeller(productId);
      setChats((prev) => {
        const existing = prev.findIndex((c) => c.id === chat.id);
        if (existing !== -1) {
          const next = [...prev];
          next[existing] = chat;
          return next;
        }
        return [chat, ...prev];
      });
      return chat.id;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      status,
      isAuthenticated,
      profile,
      login,
      register,
      logout,
      updateProfile,
      favoriteIds,
      isFavorite,
      toggleFavorite,
      likedIds,
      isLiked,
      toggleLike,
      myListings,
      myListingsLoading,
      refreshMyListings,
      removeMyListing,
      upsertMyListing,
      chats,
      refreshChats,
      contactSeller,
    }),
    [
      status,
      isAuthenticated,
      profile,
      login,
      register,
      logout,
      updateProfile,
      favoriteIds,
      isFavorite,
      toggleFavorite,
      likedIds,
      isLiked,
      toggleLike,
      myListings,
      myListingsLoading,
      refreshMyListings,
      removeMyListing,
      upsertMyListing,
      chats,
      refreshChats,
      contactSeller,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
