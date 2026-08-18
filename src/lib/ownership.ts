import type { ChatSummary, Comment, Product, UserProfile } from "@/types";

/**
 * Sahiplik kontrolünün TEK kaynağı.
 *
 * ⚠️ Bu yalnızca bir UI kontrolüdür — hangi aksiyonun gösterileceğine karar
 * verir. Gerçek yetkilendirme backend'dedir: `PUT/DELETE /api/products/{id}`
 * ve `DELETE /api/comments/{id}` sahip olmayan isteklere 403 döner. Buradaki
 * kontrolün atlatılması kullanıcıya hiçbir yetki kazandırmaz.
 */
export function isProductOwner(product: Product | null, user: UserProfile | null): boolean {
  if (!product || !user) return false;
  return product.seller.id === user.id;
}

export function isCommentOwner(comment: Comment, user: UserProfile | null): boolean {
  if (!user) return false;
  // Backend `is_mine` hesaplıyor; id karşılaştırması yedek olarak duruyor.
  return comment.isMine || comment.authorId === user.id;
}

/** Sohbetteki ilan oturum sahibine mi ait — "Düzenle" aksiyonu için. */
export function isChatListingOwner(chat: ChatSummary | null): boolean {
  return chat?.isSeller ?? false;
}

/** Kullanıcının bu ilanda görebileceği aksiyon seti. */
export interface ProductActions {
  canEdit: boolean;
  canDelete: boolean;
  canMarkSold: boolean;
  canContact: boolean;
  canFavorite: boolean;
  canLike: boolean;
  /** Yayından kaldır / tekrar yayınla — yön product.isPublished'e göre belirlenir. */
  canTogglePublish: boolean;
}

export function getProductActions(
  product: Product | null,
  user: UserProfile | null,
): ProductActions {
  const owner = isProductOwner(product, user);
  const sold = product?.sold ?? false;

  return {
    // Satılmış ilan arşivdir; düzenlenemez ve silinemez.
    canEdit: owner && !sold,
    canDelete: owner && !sold,
    canMarkSold: owner && !sold,
    // Kendi ilanınla sohbet açamazsın (backend de 400 döner).
    canContact: !owner && !sold,
    canFavorite: !owner,
    canLike: !owner,
    canTogglePublish: owner && !sold,
  };
}
