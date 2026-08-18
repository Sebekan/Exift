/**
 * Backend sözleşmesi. Alan adları FastAPI şemalarıyla birebir aynıdır
 * (snake_case) — dönüşüm yalnızca servis katmanında yapılır.
 *
 * Kaynak: backend/app/schemas/*.py, backend/app/routers/chats.py
 */

/* ---------------------------------- auth --------------------------------- */

export interface ApiUser {
  id: string;
  nickname: string;
  email: string;
  bio: string;
  avatar_url: string | null;
  phone: string | null;
  is_verified: boolean;
  joined_at: string;
}

export interface ApiAuthResponse {
  access_token: string;
  token_type: string;
  user: ApiUser;
}

export interface ApiRegisterRequest {
  nickname: string;
  email: string;
  password: string;
  phone?: string;
}

export interface ApiLoginRequest {
  email: string;
  password: string;
}

export interface ApiUserUpdateRequest {
  nickname?: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
}

/* -------------------------------- products -------------------------------- */

export interface ApiSeller {
  id: string;
  nickname: string;
  bio: string;
  avatar_url: string | null;
}

export interface ApiProduct {
  id: string;
  title: string;
  story: string;
  price: number;
  category: string;
  district: string;
  image_url: string;
  images: string[];
  has_story: boolean;
  sold: boolean;
  sold_date: string | null;
  is_published: boolean;
  museum_status: "none" | "pending" | "approved" | "rejected";
  seller: ApiSeller;
  comments_count: number;
  likes_count: number;
  is_liked: boolean;
  is_favorited: boolean;
  created_at: string;
}

export interface ApiProductListResponse {
  items: ApiProduct[];
  total: number;
  page: number;
  pages: number;
}

export interface ApiProductCreateRequest {
  title: string;
  story: string;
  price: number;
  category: string;
  district: string;
  image_url?: string;
  images: string[];
}

export type ApiProductUpdateRequest = Partial<ApiProductCreateRequest>;

export interface ApiLikeResponse {
  liked: boolean;
  likes_count: number;
}

export interface ApiFavoriteResponse {
  favorited: boolean;
}

/* -------------------------------- comments -------------------------------- */

export interface ApiComment {
  id: string;
  author_id: string;
  author_nickname: string;
  author_avatar_url: string | null;
  text: string;
  likes_count: number;
  is_liked: boolean;
  is_mine: boolean;
  created_at: string;
}

/* ---------------------------------- chats --------------------------------- */

export interface ApiChat {
  id: string;
  product_id: string;
  product_title: string;
  product_image: string;
  product_price: number;
  product_sold: boolean;
  seller_nickname: string;
  other_party_id: string;
  other_party_nickname: string;
  other_party_avatar_url: string | null;
  is_seller: boolean;
  last_message: string;
  last_message_at: string;
}

export interface ApiChatMessage {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
  is_mine: boolean;
}

export interface ApiChatDetail extends ApiChat {
  messages: ApiChatMessage[];
}

/* --------------------------------- upload --------------------------------- */

export interface ApiUploadResponse {
  url: string;
  public_id: string;
}
