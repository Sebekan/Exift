import { http } from "@/lib/api/client";
import type { ApiComment } from "@/lib/api/types";
import type { Comment } from "@/types";
import { toComment } from "./mappers";

export const commentService = {
  async list(productId: string, signal?: AbortSignal): Promise<Comment[]> {
    const res = await http.get<ApiComment[]>(
      `/api/products/${productId}/comments`,
      undefined,
      { signal },
    );
    return res.map(toComment);
  },

  async add(productId: string, text: string): Promise<Comment> {
    const res = await http.post<ApiComment>(`/api/products/${productId}/comments`, {
      text: text.trim(),
    });
    return toComment(res);
  },

  async toggleLike(commentId: string): Promise<{ liked: boolean; likesCount: number }> {
    const res = await http.post<{ liked: boolean; likes_count: number }>(
      `/api/comments/${commentId}/like`,
    );
    return { liked: res.liked, likesCount: res.likes_count };
  },

  async remove(commentId: string): Promise<void> {
    await http.delete(`/api/comments/${commentId}`);
  },
};
