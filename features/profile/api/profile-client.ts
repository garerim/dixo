// =============================================================================
// FEATURE — Client API pour les profils
// =============================================================================
// Abstraction des appels HTTP vers les route handlers profil.
// Utilisé par les hooks React — aucune logique métier.
// =============================================================================

import type {
  ApiResponse,
  FullProfile,
  PublicProfile,
  UpdateProfileRequest,
  ProfileResponse,
  PublicProfileResponse,
  UpdateProfileResponse,
  EloHistoryResponse,
} from "@/types/api";

const BASE_URL = "/api/profile";

/**
 * Helper générique pour les appels fetch.
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error ?? `Erreur HTTP ${response.status}`,
      };
    }

    return data;
  } catch {
    return {
      success: false,
      error: "Erreur réseau. Vérifiez votre connexion.",
    };
  }
}

// =============================================================================
// Endpoints
// =============================================================================

export const profileClient = {
  /** Récupère son propre profil complet */
  getMyProfile(): Promise<ProfileResponse> {
    return fetchApi("/me", { method: "GET" });
  },

  /** Met à jour son profil */
  updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    return fetchApi("/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /** Récupère le profil public d'un utilisateur */
  getPublicProfile(userId: string): Promise<PublicProfileResponse> {
    return fetchApi(`/${userId}`, { method: "GET" });
  },

  /** Récupère le classement ELO */
  getLeaderboard(limit: number = 50): Promise<ApiResponse<PublicProfile[]>> {
    return fetchApi(`/leaderboard?limit=${limit}`, { method: "GET" });
  },

  /** Recherche de profils par pseudo */
  searchProfiles(query: string, limit: number = 10): Promise<ApiResponse<PublicProfile[]>> {
    return fetchApi(`/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      method: "GET",
    });
  },

  /** Récupère l'historique ELO du joueur connecté */
  getEloHistory(mode?: "1v1" | "4p"): Promise<EloHistoryResponse> {
    const query = mode ? `?mode=${mode}` : "";
    return fetchApi(`/elo-history${query}`, { method: "GET" });
  },

  /** Upload avatar image */
  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${BASE_URL}/upload-avatar`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error ?? `HTTP error ${response.status}`,
        };
      }

      return data;
    } catch {
      return {
        success: false,
        error: "Network error. Check your connection.",
      };
    }
  },
} as const;
