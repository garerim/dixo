// =============================================================================
// SERVICE — Sanitizer d'état du jeu
// =============================================================================
// Convertit un GameState complet (avec les dés de tout le monde)
// en un PublicGameState où seuls les dés du joueur courant sont visibles.
// =============================================================================

import type { GameState } from "@/core/game-engine";
import { GamePhase } from "@/core/game-engine";
import type { PublicGameState, PublicPlayerInfo } from "@/types/api";

/**
 * Masque les dés des autres joueurs pour un joueur donné.
 * Pendant la phase CHALLENGE et RESULT, tous les dés sont révélés.
 *
 * @param state - État complet du jeu (serveur)
 * @param viewerId - ID du joueur qui regarde (ses dés restent visibles)
 * @returns État sanitisé pour le client
 */
export function sanitizeGameStateForPlayer(
  state: GameState,
  viewerId: string,
): PublicGameState {
  const revealPhases: GamePhase[] = [
    GamePhase.CHALLENGE,
    GamePhase.RESULT,
    GamePhase.GAME_OVER,
  ];
  const shouldRevealAll = revealPhases.includes(state.phase);

  const players: PublicPlayerInfo[] = state.players.map((player) => {
    const isViewer = player.id === viewerId;
    const showDice = isViewer || shouldRevealAll;

    return {
      id: player.id,
      displayName: player.displayName,
      avatarUrl: player.avatarUrl,
      subscription: player.subscription,
      diceCount: player.diceCount,
      diceValues: showDice ? [...player.diceValues] : [],
      isAlive: player.isAlive,
      isHost: player.isHost,
      seatIndex: player.seatIndex,
    };
  });

  return {
    id: state.id,
    joinCode: state.joinCode,
    gameMode: state.gameMode,
    players,
    currentPlayerIndex: state.currentPlayerIndex,
    phase: state.phase,
    currentBid: state.currentBid,
    round: state.round,
    lastChallengeResult: state.lastChallengeResult,
    winnerId: state.winnerId,
  };
}
