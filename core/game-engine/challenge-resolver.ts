// =============================================================================
// CORE DOMAIN — Résolution du Challenge (contestation d'enchère)
// =============================================================================
// Quand un joueur conteste l'enchère ("Challenge!"), on révèle tous les dés
// et on détermine qui perd un dé. Fonctions pures uniquement.
// =============================================================================

import type { Bid, ChallengeResult, GameState, PlayerState } from "./types";
import { countDiceWithFace } from "./dice";

/**
 * Résout un Challenge : détermine si l'enchère était un bluff
 * et qui perd un dé.
 *
 * Règle :
 * - Si le nombre réel de dés >= quantité annoncée → le Challenge est INCORRECT
 *   (l'enchère était valide) → le caller perd un dé
 * - Si le nombre réel < quantité annoncée → le Challenge est CORRECT
 *   (l'enchère était un bluff) → le bidder perd un dé
 *
 * @param state - État actuel du jeu
 * @param callerId - ID du joueur qui conteste
 * @returns Résultat du Challenge
 */
export function resolveChallenge(
  state: GameState,
  callerId: string,
): ChallengeResult {
  const contestedBid = state.currentBid as Bid;

  // Compter les dés réels
  const actualCount = countDiceWithFace(
    state.players,
    contestedBid.faceValue,
    state.config.pacosAreWild,
  );

  // L'enchère disait "il y a au moins X dés de face Y"
  // Challenge correct = le bluff est révélé (il y en a moins)
  const isChallengeCorrect = actualCount < contestedBid.quantity;

  // Qui perd ?
  const loserId = isChallengeCorrect ? contestedBid.playerId : callerId;

  return {
    callerId,
    bidderId: contestedBid.playerId,
    contestedBid,
    actualCount,
    isChallengeCorrect,
    loserId,
  };
}

/**
 * Applique la pénalité du Challenge : retire un dé au perdant.
 * Si le joueur n'a plus de dés, il est éliminé.
 *
 * @param players - Liste des joueurs
 * @param loserId - ID du joueur qui perd un dé
 * @returns Nouvelle liste de joueurs mise à jour
 */
export function applyChallengePenalty(
  players: readonly PlayerState[],
  loserId: string,
): readonly PlayerState[] {
  return players.map((player) => {
    if (player.id !== loserId) return player;

    const newDiceCount = player.diceCount - 1;
    return {
      ...player,
      diceCount: newDiceCount,
      isAlive: newDiceCount > 0,
      diceValues: [], // On vide les dés pour le prochain round
    };
  });
}

/**
 * Détermine s'il ne reste qu'un seul joueur vivant (= fin de partie).
 */
export function getAlivePlayers(
  players: readonly PlayerState[],
): readonly PlayerState[] {
  return players.filter((p) => p.isAlive);
}

/**
 * Retourne le gagnant s'il n'en reste qu'un, sinon null.
 */
export function getWinner(
  players: readonly PlayerState[],
): PlayerState | null {
  const alive = getAlivePlayers(players);
  return alive.length === 1 ? alive[0] : null;
}
