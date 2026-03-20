// =============================================================================
// FEATURE — Client API pour les notifications
// =============================================================================

import type {
  ApiResponse,
  NotificationsListResponse,
  UnreadCountResponse,
  MarkNotificationReadResponse,
  DeleteNotificationResponse,
} from "@/types/api";

const BASE_URL = "/api/notifications";

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

export const notificationsClient = {
  /** Récupère les notifications récentes (paginées) */
  getNotifications(page: number = 1, limit: number = 30): Promise<NotificationsListResponse> {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (limit !== 30) params.set("limit", String(limit));
    const qs = params.toString();
    return fetchApi(`/list${qs ? `?${qs}` : ""}`, { method: "GET" });
  },

  /** Récupère le nombre de notifications non lues */
  getUnreadCount(): Promise<UnreadCountResponse> {
    return fetchApi("/unread-count", { method: "GET" });
  },

  /** Marque une notification comme lue */
  markAsRead(notificationId: string): Promise<MarkNotificationReadResponse> {
    return fetchApi("/read", {
      method: "POST",
      body: JSON.stringify({ notificationId }),
    });
  },

  /** Marque toutes les notifications comme lues */
  markAllAsRead(): Promise<MarkNotificationReadResponse> {
    return fetchApi("/read-all", { method: "POST" });
  },

  /** Supprime une notification */
  delete(notificationId: string): Promise<DeleteNotificationResponse> {
    return fetchApi("/delete", {
      method: "POST",
      body: JSON.stringify({ notificationId }),
    });
  },
} as const;
