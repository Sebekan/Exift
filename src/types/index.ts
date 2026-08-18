export type CategoryId =
  | "taki-aksesuar"
  | "giyim-moda"
  | "teknoloji"
  | "diger-anilar";

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
}

export interface Comment {
  id: string;
  authorId: string;
  author: string;
  authorAvatarUrl: string | null;
  text: string;
  likes: number;
  isLiked: boolean;
  isMine: boolean;
  createdAt: string;
}

export interface ProductSeller {
  id: string;
  nickname: string;
  bio: string;
  avatarUrl: string | null;
}

export interface Product {
  id: string;
  title: string;
  story: string;
  price: number;
  category: CategoryId;
  district: string;
  imageUrl: string;
  images: string[];
  /** Backend sayacı — yorum listesi ayrıca `commentService` ile çekilir. */
  commentsCount: number;
  likes: number;
  isLiked: boolean;
  isFavorited: boolean;
  seller: ProductSeller;
  createdAt: string;
  sold: boolean;
  /** `sold` true iken dolu — Exift Müzesi'nde gösterilen arşiv tarihi. */
  soldDate: string | null;
  /** Yayından kaldırılmış ilanlar aramada/listede görünmez, sahibi görebilir. */
  isPublished: boolean;
  /** "none": hiç gönderilmedi. "pending": onay bekliyor. "approved": Müze'de görünür. "rejected": reddedildi. */
  museumStatus: "none" | "pending" | "approved" | "rejected";
}

export interface SiteConfig {
  brand: { name: string; tagline: string };
  hero: { title: string; subtitle: string; imageUrl: string };
  footer: { about: string; email: string; location: string; instagram: string; copyright: string };
  contact: { email: string };
}

export interface UserProfile {
  id: string;
  nickname: string;
  bio: string;
  email: string;
  phone: string | null;
  isVerified: boolean;
  avatarUrl: string | null;
  joinedAt: string;
}

export interface ChatSummary {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  productPrice: number;
  productSold: boolean;
  otherPartyId: string;
  otherPartyNickname: string;
  otherPartyAvatarUrl: string | null;
  /** Oturum sahibi bu sohbette satıcı tarafı mı. */
  isSeller: boolean;
  lastMessage: string;
  lastMessageAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  isMine: boolean;
  /** İyimser gönderimde henüz sunucuya ulaşmamış mesajlar için. */
  pending?: boolean;
  failed?: boolean;
}

export interface ChatThread extends ChatSummary {
  messages: ChatMessage[];
}
