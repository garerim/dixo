// =============================================================================
// CORE DOMAIN — Validation des enchères
// =============================================================================
// Règles de validation des enchères au Perudo/Dixo.
// Fonctions pures uniquement — pas d'effets de bord.
// =============================================================================

import type { Bid, GameState } from "./types";
import { GamePhase } from "./types";
import { getTotalDiceInPlay } from "./dice";

/** Résultat de la validation d'une enchère */
export interface BidValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
}

/**
 * Vérifie qu'une face de dé est valide (1-6).
 */
export function isValidFaceValue(faceValue: number): boolean {
  return Number.isInteger(faceValue) && faceValue >= 1 && faceValue <= 6;
}

/**
 * Vérifie qu'une quantité est valide (> 0 et entier).
 */
export function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1;
}

/**
 * Vérifie qu'une enchère est strictement supérieure à l'enchère précédente.
 *
 * Règles du Perudo :
 * - On peut augmenter la quantité (même face ou face supérieure)
 * - On peut augmenter la face à quantité égale
 * - Passer aux Pacos (face 1) : quantité >= ceil(currentQuantity / 2)
 * - Quitter les Pacos (face 1) vers une autre face : quantité >= currentQuantity * 2 + 1
 *
 * Version simplifiée (implémentée ici) :
 * - Augmenter la quantité avec n'importe quelle face
 * - OU garder la même quantité et augmenter la face
 */
export function isBidHigherThan(
  newBid: Bid,
  currentBid: Bid,
  pacosAreWild: boolean = true,
): boolean {
  // Transition vers les Pacos (face 1) avec règle spéciale
  if (pacosAreWild && newBid.faceValue === 1 && currentBid.faceValue !== 1) {
    return newBid.quantity >= Math.ceil(currentBid.quantity / 2);
  }

  // Transition depuis les Pacos (face 1) vers une autre face
  if (pacosAreWild && currentBid.faceValue === 1 && newBid.faceValue !== 1) {
    return newBid.quantity >= currentBid.quantity * 2 + 1;
  }

  // Même catégorie (paco→paco ou normal→normal)
  if (newBid.quantity > currentBid.quantity) {
    return true;
  }

  if (
    newBid.quantity === currentBid.quantity &&
    newBid.faceValue > currentBid.faceValue
  ) {
    return true;
  }

  return false;
}

/**
 * Valide complètement une enchère dans le contexte du jeu.
 * Vérifie toutes les règles métier.
 */
export function validateBid(
  state: GameState,
  newBid: Bid,
): BidValidationResult {
  // 1. Vérifier que le jeu est en phase d'enchère
  if (state.phase !== GamePhase.BIDDING) {
    return { isValid: false, error: "Les enchères ne sont pas ouvertes." };
  }

  // 2. Vérifier que c'est bien le tour du joueur
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== newBid.playerId) {
    return { isValid: false, error: "Ce n'est pas votre tour." };
  }

  // 3. Vérifier que le joueur est vivant
  if (!currentPlayer.isAlive) {
    return { isValid: false, error: "Ce joueur est éliminé." };
  }

  // 4. Vérifier la face du dé
  if (!isValidFaceValue(newBid.faceValue)) {
    return {
      isValid: false,
      error: "La face du dé doit être entre 1 et 6.",
    };
  }

  // 5. Vérifier la quantité
  if (!isValidQuantity(newBid.quantity)) {
    return {
      isValid: false,
      error: "La quantité doit être un entier positif.",
    };
  }

  // 6. Vérifier que la quantité ne dépasse pas le total de dés en jeu
  const totalDice = getTotalDiceInPlay(state.players);
  if (newBid.quantity > totalDice) {
    return {
      isValid: false,
      error: `La quantité ne peut pas dépasser le total de dés en jeu (${totalDice}).`,
    };
  }

  // 7. Si une enchère précédente existe, la nouvelle doit être supérieure
  if (state.currentBid !== null) {
    if (!isBidHigherThan(newBid, state.currentBid, state.config.pacosAreWild)) {
      return {
        isValid: false,
        error: "L'enchère doit être supérieure à l'enchère précédente.",
      };
    }
  }

  return { isValid: true };
}

/**
 * Vérifie si un joueur peut contester l'enchère (Challenge).
 * Un Challenge est possible uniquement si une enchère a déjà été faite.
 */
export function canCallChallenge(state: GameState, playerId: string): BidValidationResult {
  if (state.phase !== GamePhase.BIDDING) {
    return { isValid: false, error: "Impossible de contester hors de la phase d'enchère." };
  }

  if (state.currentBid === null) {
    return { isValid: false, error: "Aucune enchère n'a été faite, impossible de contester." };
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) {
    return { isValid: false, error: "Ce n'est pas votre tour." };
  }

  if (!currentPlayer.isAlive) {
    return { isValid: false, error: "Ce joueur est éliminé." };
  }

  // On ne peut pas contester sa propre enchère
  if (state.currentBid.playerId === playerId) {
    return { isValid: false, error: "Vous ne pouvez pas contester votre propre enchère." };
  }

  return { isValid: true };
}
