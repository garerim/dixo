// =============================================================================
// CORE DOMAIN — Gestion des tours
// =============================================================================
// Gère la rotation des tours entre les joueurs vivants.
// Fonctions pures uniquement.
// =============================================================================

import type { GameState, PlayerState } from "./types";

/**
 * Trouve l'index du prochain joueur vivant après l'index donné.
 * Boucle de manière circulaire dans la liste des joueurs.
 *
 * @param players - Liste des joueurs
 * @param currentIndex - Index actuel
 * @returns Index du prochain joueur vivant, ou -1 si aucun
 */
export function getNextAlivePlayerIndex(
  players: readonly PlayerState[],
  currentIndex: number,
): number {
  const count = players.length;
  if (count === 0) return -1;

  for (let i = 1; i <= count; i++) {
    const nextIndex = (currentIndex + i) % count;
    if (players[nextIndex].isAlive) {
      return nextIndex;
    }
  }

  return -1; // Aucun joueur vivant trouvé
}

/**
 * Avance au joueur suivant et retourne le nouvel état.
 */
export function advanceToNextPlayer(state: GameState): GameState {
  const nextIndex = getNextAlivePlayerIndex(
    state.players,
    state.currentPlayerIndex,
  );

  return {
    ...state,
    currentPlayerIndex: nextIndex,
  };
}

/**
 * Détermine l'index du joueur qui commence un nouveau round.
 * En règle au Perudo, le perdant du challenge commence le round suivant.
 * S'il est éliminé, c'est le joueur vivant suivant.
 *
 * @param players - Liste des joueurs
 * @param loserIndex - Index du perdant du challenge
 * @returns Index du joueur qui commence le round
 */
export function getStartingPlayerIndex(
  players: readonly PlayerState[],
  loserIndex: number,
): number {
  // Si le perdant est encore vivant, il commence
  if (players[loserIndex]?.isAlive) {
    return loserIndex;
  }

  // Sinon, le joueur vivant suivant commence
  return getNextAlivePlayerIndex(players, loserIndex);
}

/**
 * Vérifie si c'est le tour du joueur donné.
 */
export function isPlayerTurn(state: GameState, playerId: string): boolean {
  const currentPlayer = state.players[state.currentPlayerIndex];
  return currentPlayer?.id === playerId;
}

/**
 * Retourne le joueur dont c'est le tour.
 */
export function getCurrentPlayer(state: GameState): PlayerState | undefined {
  return state.players[state.currentPlayerIndex];
}

/**
 * Retourne l'index d'un joueur par son ID.
 * @returns Index du joueur ou -1 si non trouvé
 */
export function getPlayerIndex(
  players: readonly PlayerState[],
  playerId: string,
): number {
  return players.findIndex((p) => p.id === playerId);
}
