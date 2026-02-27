// =============================================================================
// FEATURE — Client API pour le matchmaking
// =============================================================================

import type {
  ApiResponse,
  JoinQueueRequest,
  LeaveQueueRequest,
  JoinQueueResponse,
  QueueStatusResponse,
  LeaveQueueResponse,
} from "@/types/api";

const BASE_URL = "/api/matchmaking";

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

export const matchmakingClient = {
  /** Rejoindre la file d'attente */
  joinQueue(data: JoinQueueRequest): Promise<JoinQueueResponse> {
    return fetchApi("/join", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Quitter la file d'attente */
  leaveQueue(data: LeaveQueueRequest): Promise<LeaveQueueResponse> {
    return fetchApi("/leave", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Vérifier le statut */
  getStatus(): Promise<QueueStatusResponse> {
    return fetchApi("/status", { method: "GET" });
  },
} as const;
