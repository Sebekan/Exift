import { http } from "@/lib/api/client";
import type {
  ApiFavoriteResponse,
  ApiLikeResponse,
  ApiProduct,
  ApiProductCreateRequest,
  ApiProductListResponse,
  ApiProductUpdateRequest,
} from "@/lib/api/types";
import type { SortOption } from "@/lib/filters";
import type { CategoryId, Product } from "@/types";
import { toProduct } from "./mappers";

export interface ListingQuery {
  category?: CategoryId;
  district?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  page?: number;
  limit?: number;
}

export interface ListingPage {
  items: Product[];
  total: number;
  page: number;
  pages: number;
}

export interface ListingInput {
  title: string;
  story: string;
  price: number;
  category: CategoryId;
  district: string;
  /** Sıralı görsel listesi; ilk eleman kapak görselidir. */
  images: string[];
}

function toPage(res: ApiProductListResponse): ListingPage {
  return {
    items: res.items.map(toProduct),
    total: res.total,
    page: res.page,
    pages: res.pages,
  };
}

export const listingService = {
  /** Satışta olan ilanlar (backend `sold=false` filtreler). */
  async list(query: ListingQuery = {}, signal?: AbortSignal): Promise<ListingPage> {
    const res = await http.get<ApiProductListResponse>(
      "/api/products/",
      {
        category: query.category,
        district: query.district,
        q: query.q,
        // Sunucu snake_case bekliyor; dönüşüm yalnızca burada.
        min_price: query.minPrice,
        max_price: query.maxPrice,
        sort: query.sort,
        page: query.page,
        limit: query.limit,
      },
      { signal },
    );
    return toPage(res);
  },

  /** Satılmış ilanlar — Exift Müzesi. */
  async listMuseum(page = 1, limit = 24, signal?: AbortSignal): Promise<ListingPage> {
    const res = await http.get<ApiProductListResponse>(
      "/api/products/museum",
      { page, limit },
      { signal },
    );
    return toPage(res);
  },

  /** Oturum sahibinin tüm ilanları (satılanlar dahil). */
  async listMine(signal?: AbortSignal): Promise<Product[]> {
    const res = await http.get<ApiProduct[]>("/api/products/mine", undefined, { signal });
    return res.map(toProduct);
  },

  async listFavorites(signal?: AbortSignal): Promise<Product[]> {
    const res = await http.get<ApiProduct[]>("/api/products/favorites", undefined, { signal });
    return res.map(toProduct);
  },

  async get(id: string, signal?: AbortSignal): Promise<Product> {
    const res = await http.get<ApiProduct>(`/api/products/${id}`, undefined, { signal });
    return toProduct(res);
  },

  async create(input: ListingInput): Promise<Product> {
    const body: ApiProductCreateRequest = {
      title: input.title.trim(),
      story: input.story.trim(),
      price: input.price,
      category: input.category,
      district: input.district,
      images: input.images,
      image_url: input.images[0] ?? "",
    };
    return toProduct(await http.post<ApiProduct>("/api/products/", body));
  },

  /** Yalnızca değişen alanları gönderir — backend `exclude_unset` ile çalışır. */
  async update(id: string, changes: Partial<ListingInput>): Promise<Product> {
    const body: ApiProductUpdateRequest = {};
    if (changes.title !== undefined) body.title = changes.title.trim();
    if (changes.story !== undefined) body.story = changes.story.trim();
    if (changes.price !== undefined) body.price = changes.price;
    if (changes.category !== undefined) body.category = changes.category;
    if (changes.district !== undefined) body.district = changes.district;
    if (changes.images !== undefined) {
      body.images = changes.images;
      body.image_url = changes.images[0] ?? "";
    }
    return toProduct(await http.put<ApiProduct>(`/api/products/${id}`, body));
  },

  async remove(id: string): Promise<void> {
    await http.delete(`/api/products/${id}`);
  },

  /** İlanı satıldı olarak işaretler. */
  async markAsSold(id: string): Promise<Product> {
    return toProduct(await http.post<ApiProduct>(`/api/products/${id}/sell`));
  },

  /** Satılmış bir ilanı Exift Müzesi'ne gönderir — onay bekler. */
  async submitToMuseum(id: string): Promise<Product> {
    return toProduct(await http.post<ApiProduct>(`/api/products/${id}/museum-submit`));
  },

  /** İlanı yayından kaldırır (silmeden) — arama/listede görünmez olur. */
  async unpublish(id: string): Promise<Product> {
    return toProduct(await http.post<ApiProduct>(`/api/products/${id}/unpublish`));
  },

  /** Yayından kaldırılmış ilanı tekrar yayına alır. */
  async republish(id: string): Promise<Product> {
    return toProduct(await http.post<ApiProduct>(`/api/products/${id}/republish`));
  },

  async toggleLike(id: string): Promise<{ liked: boolean; likesCount: number }> {
    const res = await http.post<ApiLikeResponse>(`/api/products/${id}/like`);
    return { liked: res.liked, likesCount: res.likes_count };
  },

  async toggleFavorite(id: string): Promise<boolean> {
    const res = await http.post<ApiFavoriteResponse>(`/api/products/${id}/favorite`);
    return res.favorited;
  },
};
