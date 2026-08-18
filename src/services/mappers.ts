import type {
  ApiChat,
  ApiChatDetail,
  ApiChatMessage,
  ApiComment,
  ApiProduct,
  ApiUser,
} from "@/lib/api/types";
import type {
  CategoryId,
  ChatMessage,
  ChatSummary,
  ChatThread,
  Comment,
  Product,
  UserProfile,
} from "@/types";
import { categories } from "@/lib/categories";

const KNOWN_CATEGORY_IDS = new Set(categories.map((c) => c.id));

/** Backend serbest metin kategori tutuyor; bilinmeyen değerler "diğer"e düşer. */
function toCategoryId(value: string): CategoryId {
  return KNOWN_CATEGORY_IDS.has(value as CategoryId) ? (value as CategoryId) : "diger-anilar";
}

export function toProduct(p: ApiProduct): Product {
  // image_url ile images tutarsız olabilir (eski kayıtlar) — tek listeye indir.
  const gallery = p.images?.length ? p.images : p.image_url ? [p.image_url] : [];

  return {
    id: p.id,
    title: p.title ?? "",
    story: p.story ?? "",
    price: Number.isFinite(p.price) ? p.price : 0,
    category: toCategoryId(p.category),
    district: p.district,
    imageUrl: gallery[0] ?? "",
    images: gallery,
    commentsCount: p.comments_count ?? 0,
    likes: p.likes_count ?? 0,
    isLiked: p.is_liked ?? false,
    isFavorited: p.is_favorited ?? false,
    seller: {
      id: p.seller?.id ?? "",
      nickname: p.seller?.nickname ?? "Kullanıcı",
      bio: p.seller?.bio ?? "",
      avatarUrl: p.seller?.avatar_url ?? null,
    },
    createdAt: p.created_at,
    sold: p.sold ?? false,
    soldDate: p.sold_date ?? null,
    isPublished: p.is_published ?? true,
    museumStatus: p.museum_status ?? "none",
  };
}

export function toUserProfile(u: ApiUser): UserProfile {
  return {
    id: u.id,
    nickname: u.nickname ?? "",
    bio: u.bio ?? "",
    email: u.email ?? "",
    phone: u.phone ?? null,
    isVerified: u.is_verified ?? false,
    avatarUrl: u.avatar_url,
    joinedAt: u.joined_at,
  };
}

export function toComment(c: ApiComment): Comment {
  return {
    id: c.id,
    authorId: c.author_id,
    author: c.author_nickname ?? "Kullanıcı",
    authorAvatarUrl: c.author_avatar_url ?? null,
    text: c.text ?? "",
    likes: c.likes_count ?? 0,
    isLiked: c.is_liked ?? false,
    isMine: c.is_mine ?? false,
    createdAt: c.created_at,
  };
}

/**
 * Sohbet dönüşümü bilinçli olarak savunmacıdır.
 *
 * `other_party_*`, `product_price` ve `is_seller` alanları backend'e sonradan
 * eklendi. Frontend güncel ama API henüz dağıtılmamışsa bu alanlar `undefined`
 * gelir; doğrudan aktarılırsa `Avatar` içinde `nickname.trim()` ve
 * `formatPrice(undefined)` çalışma zamanında patlar. Varsayılanlar, sürüm farkı
 * olan bir ortamda uygulamanın çökmesini engeller.
 */
export function toChatSummary(c: ApiChat): ChatSummary {
  return {
    id: c.id,
    productId: c.product_id,
    productTitle: c.product_title ?? "İlan",
    productImage: c.product_image ?? "",
    productPrice: Number.isFinite(c.product_price) ? c.product_price : 0,
    productSold: c.product_sold ?? false,
    otherPartyId: c.other_party_id ?? "",
    // Eski API karşı tarafı döndürmüyordu; elde olan tek ad satıcınınki.
    otherPartyNickname: c.other_party_nickname ?? c.seller_nickname ?? "Kullanıcı",
    otherPartyAvatarUrl: c.other_party_avatar_url ?? null,
    isSeller: c.is_seller ?? false,
    lastMessage: c.last_message ?? "",
    lastMessageAt: c.last_message_at,
  };
}

export function toChatMessage(m: ApiChatMessage): ChatMessage {
  return {
    id: m.id,
    senderId: m.sender_id,
    text: m.text,
    createdAt: m.created_at,
    isMine: m.is_mine,
  };
}

export function toChatThread(c: ApiChatDetail): ChatThread {
  return { ...toChatSummary(c), messages: c.messages.map(toChatMessage) };
}
