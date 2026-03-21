// =============================================================================
// FEATURE — Client API pour les achievements
// =============================================================================

import type { ApiResponse, AchievementsListResponse } from "@/types/api";

const BASE_URL = "/api/achievements";

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

export const achievementsClient = {
  /** Récupère tous les achievements avec la progression du joueur connecté */
  getMyAchievements(): Promise<AchievementsListResponse> {
    return fetchApi("/list", { method: "GET" });
  },

  /** Récupère les achievements débloqués d'un autre joueur */
  getUserAchievements(userId: string): Promise<AchievementsListResponse> {
    return fetchApi(`/user/${userId}`, { method: "GET" });
  },
} as const;
