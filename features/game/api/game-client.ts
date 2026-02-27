// =============================================================================
// FEATURE — Client API pour le jeu
// =============================================================================
// Abstraction des appels HTTP vers les route handlers.
// Utilisé par les hooks React — aucune logique métier.
// =============================================================================

import type {
  CreateGameRequest,
  JoinGameRequest,
  PlaceBidRequest,
  CallChallengeRequest,
  StartGameRequest,
  NextRoundRequest,
  SurrenderRequest,
  CreateGameResponse,
  JoinGameResponse,
  GameStateResponse,
  PlaceBidResponse,
  CallChallengeResponse,
  SurrenderResponse,
  ApiResponse,
} from "@/types/api";
import type { GameMode } from "@/core/game-engine";

const BASE_URL = "/api/game";

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

export const gameClient = {
  /** Crée une nouvelle partie */
  createGame(data: CreateGameRequest): Promise<CreateGameResponse> {
    return fetchApi("/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Rejoint une partie existante */
  joinGame(data: JoinGameRequest): Promise<JoinGameResponse> {
    return fetchApi("/join", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Démarre la partie */
  startGame(data: StartGameRequest): Promise<GameStateResponse> {
    return fetchApi("/start", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Place une enchère */
  placeBid(data: PlaceBidRequest): Promise<PlaceBidResponse> {
    return fetchApi("/bid", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Conteste l'enchère (Challenge) */
  callChallenge(data: CallChallengeRequest): Promise<CallChallengeResponse> {
    return fetchApi("/challenge", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Passe au round suivant */
  nextRound(data: NextRoundRequest): Promise<GameStateResponse> {
    return fetchApi("/next-round", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Abandonne la partie */
  surrender(data: SurrenderRequest): Promise<SurrenderResponse> {
    return fetchApi("/surrender", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Récupère l'état du jeu */
  getGameState(gameId: string): Promise<GameStateResponse> {
    return fetchApi(`/${gameId}`, {
      method: "GET",
    });
  },
} as const;
