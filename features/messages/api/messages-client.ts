// =============================================================================
// FEATURE — Client API pour les messages
// =============================================================================

import type {
  ApiResponse,
  PrivateMessage,
  SendMessageRequest,
  SendMessageResponse,
  GetConversationResponse,
  MarkMessagesReadResponse,
} from "@/types/api";

const BASE_URL = "/api/messages";

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error ?? `Erreur HTTP ${response.status}` };
    }

    return data;
  } catch {
    return { success: false, error: "Erreur réseau." };
  }
}

export const messagesClient = {
  /** Envoie un message */
  sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
    return fetchApi("/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Récupère une conversation */
  getConversation(friendId: string, limit?: number, before?: string): Promise<GetConversationResponse> {
    const params = new URLSearchParams({ friendId });
    if (limit) params.set("limit", limit.toString());
    if (before) params.set("before", before);
    return fetchApi(`/conversation?${params}`, { method: "GET" });
  },

  /** Marque les messages comme lus */
  markAsRead(friendId: string): Promise<MarkMessagesReadResponse> {
    return fetchApi("/read", {
      method: "POST",
      body: JSON.stringify({ friendId }),
    });
  },
} as const;
