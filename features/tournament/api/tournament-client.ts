// =============================================================================
// FEATURE — Client API pour les tournois
// =============================================================================
// Abstraction des appels HTTP vers les route handlers.
// Utilisé par les hooks React — aucune logique métier.
// =============================================================================

import type { ApiResponse } from "@/types/api";
import type { TournamentRow } from "@/types/database";

const BASE_URL = "/api/tournament";

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

export const tournamentClient = {
  /** Liste les tournois disponibles */
  list(): Promise<ApiResponse<TournamentRow[]>> {
    return fetchApi("/list", {
      method: "GET",
    });
  },

  /** Récupère un tournoi par son ID */
  getById(id: string): Promise<ApiResponse<TournamentRow>> {
    return fetchApi(`/${id}`, {
      method: "GET",
    });
  },

  /** S'inscrire à un tournoi */
  register(tournamentId: string): Promise<ApiResponse<void>> {
    return fetchApi("/register", {
      method: "POST",
      body: JSON.stringify({ tournamentId }),
    });
  },

  /** Se désinscrire d'un tournoi */
  unregister(tournamentId: string): Promise<ApiResponse<void>> {
    return fetchApi("/unregister", {
      method: "POST",
      body: JSON.stringify({ tournamentId }),
    });
  },

  /** Historique des tournois du joueur */
  history(): Promise<ApiResponse<TournamentRow[]>> {
    return fetchApi("/history", {
      method: "GET",
    });
  },
} as const;
