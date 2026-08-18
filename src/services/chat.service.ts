import { http } from "@/lib/api/client";
import type { ApiChat, ApiChatDetail, ApiChatMessage } from "@/lib/api/types";
import type { ChatMessage, ChatSummary, ChatThread } from "@/types";
import { toChatMessage, toChatSummary, toChatThread } from "./mappers";

export const chatService = {
  async list(signal?: AbortSignal): Promise<ChatSummary[]> {
    const res = await http.get<ApiChat[]>("/api/chats/", undefined, { signal });
    return res.map(toChatSummary);
  },

  async get(chatId: string, signal?: AbortSignal): Promise<ChatThread> {
    const res = await http.get<ApiChatDetail>(`/api/chats/${chatId}`, undefined, { signal });
    return toChatThread(res);
  },

  /**
   * İlan üzerinden sohbet açar. Sohbet zaten varsa backend mevcut olanı döner,
   * yani bu çağrı idempotenttir.
   */
  async contactSeller(productId: string): Promise<ChatSummary> {
    const res = await http.post<ApiChat>(`/api/chats/contact/${productId}`);
    return toChatSummary(res);
  },

  async sendMessage(chatId: string, text: string): Promise<ChatMessage> {
    const res = await http.post<ApiChatMessage>(`/api/chats/${chatId}/messages`, {
      text: text.trim(),
    });
    return toChatMessage(res);
  },
};
