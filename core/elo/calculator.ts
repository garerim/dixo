// =============================================================================
// CORE DOMAIN — Calculateur ELO (fonctions pures)
// =============================================================================
// Implémente le système de classement ELO adapté au multijoueur.
// Utilise la méthode des paires (pairwise) pour les parties à 2+ joueurs.
//
// Aucune dépendance externe — fonctions pures et testables.
// =============================================================================

import type { EloPlayer, EloChange, EloConfig } from "./types";
import { DEFAULT_ELO_CONFIG } from "./types";

// =============================================================================
// Calcul ELO
// =============================================================================

/**
 * Calcule la probabilité attendue qu'un joueur A batte un joueur B.
 *
 * Formule : E(A) = 1 / (1 + 10^((Rb - Ra) / 400))
 */
export function expectedScore(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
}

/**
 * Détermine le facteur K à utiliser pour un joueur.
 *
 * - Nouveau joueur (< 30 parties) : K = 40 (apprentissage rapide)
 * - Joueur standard : K = 20
 * - Joueur haut classement (> 2000) : K = 10 (stabilité)
 */
export function getKFactor(
  elo: number,
  gamesPlayed: number,
  config: EloConfig = DEFAULT_ELO_CONFIG,
): number {
  if (gamesPlayed < config.newPlayerThreshold) {
    return config.kFactorNew;
  }
  if (elo >= config.highEloThreshold) {
    return config.kFactorHigh;
  }
  return config.kFactorNormal;
}

/**
 * Calcule le score réel d'un joueur par rapport à un adversaire
 * en fonction de leurs placements.
 *
 * - Si A est mieux classé que B → score = 1 (victoire)
 * - Si A est moins bien classé que B → score = 0 (défaite)
 * - Si même placement → score = 0.5 (égalité, ne devrait pas arriver)
 */
export function actualScore(placementA: number, placementB: number): number {
  if (placementA < placementB) return 1; // A mieux classé = victoire
  if (placementA > placementB) return 0; // A moins bien classé = défaite
  return 0.5; // Égalité
}

/**
 * Calcule les changements ELO pour une partie multijoueur.
 *
 * Utilise la méthode pairwise : chaque joueur est comparé à chaque autre
 * joueur dans la partie, et le delta ELO est la moyenne pondérée de
 * toutes les comparaisons.
 *
 * @param players - Liste des joueurs avec leur ELO et placement final
 * @param gamesPlayedMap - Map userId → nombre de parties jouées (pour le K-factor)
 * @param config - Configuration ELO
 * @returns Liste des changements ELO pour chaque joueur
 */
export function calculateMultiplayerElo(
  players: readonly EloPlayer[],
  gamesPlayedMap: ReadonlyMap<string, number>,
  config: EloConfig = DEFAULT_ELO_CONFIG,
): EloChange[] {
  if (players.length < 2) {
    return players.map((p) => ({
      playerId: p.id,
      oldElo: p.elo,
      newElo: p.elo,
      delta: 0,
    }));
  }

  const changes: EloChange[] = [];

  for (const player of players) {
    const kFactor = getKFactor(
      player.elo,
      gamesPlayedMap.get(player.id) ?? 0,
      config,
    );

    let totalExpected = 0;
    let totalActual = 0;

    // Comparer avec chaque autre joueur
    for (const opponent of players) {
      if (opponent.id === player.id) continue;

      totalExpected += expectedScore(player.elo, opponent.elo);
      totalActual += actualScore(player.placement, opponent.placement);
    }

    // Normaliser par le nombre d'adversaires
    const numOpponents = players.length - 1;
    const normalizedExpected = totalExpected / numOpponents;
    const normalizedActual = totalActual / numOpponents;

    // Calcul du delta ELO
    const delta = Math.round(kFactor * (normalizedActual - normalizedExpected));

    // Appliquer les limites
    const newElo = clampElo(player.elo + delta, config);

    changes.push({
      playerId: player.id,
      oldElo: player.elo,
      newElo,
      delta: newElo - player.elo,
    });
  }

  return changes;
}

/**
 * Calcul ELO simplifié pour un 1v1.
 */
export function calculateDuelElo(
  winner: { id: string; elo: number; gamesPlayed: number },
  loser: { id: string; elo: number; gamesPlayed: number },
  config: EloConfig = DEFAULT_ELO_CONFIG,
): { winner: EloChange; loser: EloChange } {
  const kWinner = getKFactor(winner.elo, winner.gamesPlayed, config);
  const kLoser = getKFactor(loser.elo, loser.gamesPlayed, config);

  const expectedWinner = expectedScore(winner.elo, loser.elo);
  const expectedLoser = expectedScore(loser.elo, winner.elo);

  const deltaWinner = Math.round(kWinner * (1 - expectedWinner));
  const deltaLoser = Math.round(kLoser * (0 - expectedLoser));

  return {
    winner: {
      playerId: winner.id,
      oldElo: winner.elo,
      newElo: clampElo(winner.elo + deltaWinner, config),
      delta: deltaWinner,
    },
    loser: {
      playerId: loser.id,
      oldElo: loser.elo,
      newElo: clampElo(loser.elo + deltaLoser, config),
      delta: deltaLoser,
    },
  };
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Clamp l'ELO entre les bornes min et max.
 */
function clampElo(elo: number, config: EloConfig = DEFAULT_ELO_CONFIG): number {
  return Math.max(config.minElo, Math.min(config.maxElo, elo));
}

/**
 * Détermine les placements à partir de l'ordre d'élimination.
 *
 * Le dernier joueur vivant a le placement 1 (gagnant).
 * Le premier éliminé a le plus haut placement.
 *
 * @param eliminationOrder - IDs des joueurs dans l'ordre d'élimination
 *                           (premier éliminé en premier)
 * @param winnerId - ID du gagnant
 * @returns Map de playerId → placement
 */
export function buildPlacements(
  eliminationOrder: readonly string[],
  winnerId: string,
): Map<string, number> {
  const placements = new Map<string, number>();

  // Le gagnant est 1er
  placements.set(winnerId, 1);

  // Les éliminés : le dernier éliminé est 2ème, l'avant-dernier 3ème, etc.
  const totalPlayers = eliminationOrder.length + 1; // +1 pour le gagnant
  for (let i = 0; i < eliminationOrder.length; i++) {
    placements.set(eliminationOrder[i], totalPlayers - i);
  }

  return placements;
}
