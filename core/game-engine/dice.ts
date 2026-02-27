// =============================================================================
// CORE DOMAIN — Logique de lancer de dés
// =============================================================================
// Fonctions pures pour le lancer de dés et le comptage.
// Le générateur aléatoire est injectable pour la testabilité.
// =============================================================================

import type { GameState, PlayerState } from "./types";

/** Type pour un générateur de nombres aléatoires (injectable pour les tests) */
export type RandomGenerator = () => number;

/** Générateur par défaut utilisant Math.random */
export const defaultRandom: RandomGenerator = () => Math.random();

/**
 * Lance un seul dé (1-6).
 * @param random - Générateur aléatoire injectable
 * @returns Valeur du dé entre 1 et 6
 */
export function rollDie(random: RandomGenerator = defaultRandom): number {
  return Math.floor(random() * 6) + 1;
}

/**
 * Lance N dés et retourne un tableau de valeurs.
 * @param count - Nombre de dés à lancer
 * @param random - Générateur aléatoire injectable
 * @returns Tableau des valeurs des dés
 */
export function rollDice(
  count: number,
  random: RandomGenerator = defaultRandom,
): readonly number[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, () => rollDie(random));
}

/**
 * Lance les dés pour tous les joueurs vivants.
 * Retourne un nouveau GameState avec les dés mis à jour.
 * Fonction PURE — ne modifie pas l'état d'entrée.
 */
export function rollDiceForAllPlayers(
  state: GameState,
  random: RandomGenerator = defaultRandom,
): GameState {
  const updatedPlayers = state.players.map((player) => {
    if (!player.isAlive) return player;
    return {
      ...player,
      diceValues: rollDice(player.diceCount, random),
    } satisfies PlayerState;
  });

  return {
    ...state,
    players: updatedPlayers,
  };
}

/**
 * Compte le nombre total de dés montrant une face donnée
 * parmi TOUS les joueurs vivants.
 *
 * Si pacosAreWild est true, les faces 1 (Pacos) comptent
 * comme des jokers et sont ajoutés au total (sauf si la face demandée est 1).
 *
 * @param players - Liste des joueurs
 * @param faceValue - Face à compter
 * @param pacosAreWild - Les Pacos sont-ils des jokers ?
 * @returns Le nombre total de dés correspondant
 */
export function countDiceWithFace(
  players: readonly PlayerState[],
  faceValue: number,
  pacosAreWild: boolean = true,
): number {
  let count = 0;

  for (const player of players) {
    if (!player.isAlive) continue;

    for (const die of player.diceValues) {
      if (die === faceValue) {
        count++;
      } else if (pacosAreWild && faceValue !== 1 && die === 1) {
        // Les Pacos (1) comptent comme jokers, sauf quand on cherche les 1
        count++;
      }
    }
  }

  return count;
}

/**
 * Retourne le nombre total de dés en jeu (tous joueurs vivants confondus).
 */
export function getTotalDiceInPlay(
  players: readonly PlayerState[],
): number {
  return players.reduce((total, player) => {
    return player.isAlive ? total + player.diceCount : total;
  }, 0);
}
