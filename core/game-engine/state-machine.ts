// =============================================================================
// CORE DOMAIN — Machine d'état du jeu
// =============================================================================
// Orchestrateur pur du game engine. Chaque action retourne un nouveau GameState.
// C'est le point d'entrée principal du domaine métier.
// Aucune dépendance externe (pas de DB, pas de réseau).
// =============================================================================

import type {
  Bid,
  ChallengeResult,
  GameActionResult,
  GameConfig,
  GameState,
  PlayerState,
} from "./types";
import { DEFAULT_GAME_CONFIG, GamePhase, GameMode } from "./types";
import { rollDiceForAllPlayers, type RandomGenerator, defaultRandom } from "./dice";
import { validateBid, canCallChallenge } from "./bid-validator";
import { resolveChallenge, applyChallengePenalty, getAlivePlayers, getWinner } from "./challenge-resolver";
import {
  advanceToNextPlayer,
  getStartingPlayerIndex,
  getPlayerIndex,
} from "./turn-manager";

// =============================================================================
// Création d'une partie
// =============================================================================

/**
 * Génère un code d'accès aléatoire à 6 caractères.
 */
export function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans I, O, 0, 1 pour éviter la confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Crée un nouvel état de jeu initial en phase LOBBY.
 *
 * @param gameId - ID unique de la partie
 * @param hostPlayer - Informations du joueur hôte
 * @param gameMode - Mode de jeu (PRIVATE, NORMAL, RANKED)
 * @param config - Configuration optionnelle de la partie
 * @returns État initial du jeu
 */
export function createInitialGameState(
  gameId: string,
  hostPlayer: { id: string; displayName: string; avatarUrl?: string },
  gameMode: GameMode = GameMode.PRIVATE,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): GameState {
  const now = new Date().toISOString();

  const host: PlayerState = {
    id: hostPlayer.id,
    displayName: hostPlayer.displayName,
    avatarUrl: hostPlayer.avatarUrl,
    diceCount: config.initialDiceCount,
    diceValues: [],
    isAlive: true,
    isHost: true,
    seatIndex: 0,
  };

  return {
    id: gameId,
    joinCode: generateJoinCode(),
    gameMode,
    config,
    players: [host],
    currentPlayerIndex: 0,
    phase: GamePhase.LOBBY,
    currentBid: null,
    round: 0,
    lastChallengeResult: null,
    winnerId: null,
    createdAt: now,
    updatedAt: now,
  };
}

// =============================================================================
// Rejoindre une partie
// =============================================================================

/**
 * Ajoute un joueur à la partie (phase LOBBY uniquement).
 */
export function addPlayer(
  state: GameState,
  player: { id: string; displayName: string; avatarUrl?: string },
): GameActionResult {
  if (state.phase !== GamePhase.LOBBY) {
    return { success: false, state, error: "La partie a déjà commencé." };
  }

  if (state.players.length >= state.config.maxPlayers) {
    return { success: false, state, error: "La partie est pleine." };
  }

  if (state.players.some((p) => p.id === player.id)) {
    return { success: false, state, error: "You are already in the game." };
  }

  const newPlayer: PlayerState = {
    id: player.id,
    displayName: player.displayName,
    avatarUrl: player.avatarUrl,
    diceCount: state.config.initialDiceCount,
    diceValues: [],
    isAlive: true,
    isHost: false,
    seatIndex: state.players.length,
  };

  return {
    success: true,
    state: {
      ...state,
      players: [...state.players, newPlayer],
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Retire un joueur de la partie (phase LOBBY uniquement).
 */
export function removePlayer(
  state: GameState,
  playerId: string,
): GameActionResult {
  if (state.phase !== GamePhase.LOBBY) {
    return {
      success: false,
      state,
      error: "Impossible de quitter une partie en cours.",
    };
  }

  const playerIndex = getPlayerIndex(state.players, playerId);
  if (playerIndex === -1) {
    return { success: false, state, error: "Joueur non trouvé." };
  }

  // Host cannot leave (they must destroy the game)
  if (state.players[playerIndex].isHost) {
    return {
      success: false,
      state,
      error: "The host cannot leave the game.",
    };
  }

  const updatedPlayers = state.players
    .filter((p) => p.id !== playerId)
    .map((p, index) => ({ ...p, seatIndex: index }));

  return {
    success: true,
    state: {
      ...state,
      players: updatedPlayers,
      updatedAt: new Date().toISOString(),
    },
  };
}

// =============================================================================
// Démarrer la partie
// =============================================================================

/**
 * Starts the game: transitions from LOBBY to ROLLING.
 * Only the host can start.
 */
export function startGame(
  state: GameState,
  hostId: string,
  random: RandomGenerator = defaultRandom,
): GameActionResult {
  if (state.phase !== GamePhase.LOBBY) {
    return { success: false, state, error: "The game has already started." };
  }

  const host = state.players.find((p) => p.isHost);
  if (!host || host.id !== hostId) {
    return {
      success: false,
      state,
      error: "Only the host can start the game.",
    };
  }

  if (state.players.length < state.config.minPlayers) {
    return {
      success: false,
      state,
      error: `Il faut au moins ${state.config.minPlayers} joueurs pour démarrer.`,
    };
  }

  // Lancer les dés pour le premier round
  const rolledState = rollDiceForAllPlayers(
    {
      ...state,
      phase: GamePhase.ROLLING,
      round: 1,
      currentPlayerIndex: 0,
      updatedAt: new Date().toISOString(),
    },
    random,
  );

  // Passer directement en phase BIDDING
  return {
    success: true,
    state: {
      ...rolledState,
      phase: GamePhase.BIDDING,
    },
  };
}

// =============================================================================
// Placer une enchère
// =============================================================================

/**
 * Place une enchère et passe au joueur suivant.
 */
export function placeBid(
  state: GameState,
  bid: { playerId: string; quantity: number; faceValue: number },
): GameActionResult {
  const newBid: Bid = {
    playerId: bid.playerId,
    quantity: bid.quantity,
    faceValue: bid.faceValue,
  };

  // Valider l'enchère
  const validation = validateBid(state, newBid);
  if (!validation.isValid) {
    return { success: false, state, error: validation.error };
  }

  // Appliquer l'enchère et avancer au joueur suivant
  const stateWithBid: GameState = {
    ...state,
    currentBid: newBid,
    updatedAt: new Date().toISOString(),
  };

  const stateWithNextPlayer = advanceToNextPlayer(stateWithBid);

  return {
    success: true,
    state: stateWithNextPlayer,
  };
}

// =============================================================================
// Contester l'enchère (Challenge)
// =============================================================================

/**
 * Un joueur conteste la dernière enchère (Challenge).
 * Résout immédiatement le challenge et applique la pénalité.
 */
export function callChallenge(
  state: GameState,
  callerId: string,
): GameActionResult {
  // Valider l'appel
  const validation = canCallChallenge(state, callerId);
  if (!validation.isValid) {
    return { success: false, state, error: validation.error };
  }

  // Résoudre le Challenge
  const challengeResult: ChallengeResult = resolveChallenge(state, callerId);

  // Appliquer la pénalité
  const updatedPlayers = applyChallengePenalty(state.players, challengeResult.loserId);

  // Vérifier s'il y a un gagnant
  const winner = getWinner(updatedPlayers);

  const newState: GameState = {
    ...state,
    players: updatedPlayers,
    phase: winner ? GamePhase.GAME_OVER : GamePhase.RESULT,
    lastChallengeResult: challengeResult,
    winnerId: winner?.id ?? null,
    currentBid: null,
    updatedAt: new Date().toISOString(),
  };

  return {
    success: true,
    state: newState,
  };
}

// =============================================================================
// Nouveau round
// =============================================================================

/**
 * Passe au round suivant après l'affichage des résultats.
 * Lance les dés pour tous les joueurs vivants et repart en BIDDING.
 */
export function startNextRound(
  state: GameState,
  random: RandomGenerator = defaultRandom,
): GameActionResult {
  if (state.phase !== GamePhase.RESULT) {
    return {
      success: false,
      state,
      error: "Impossible de passer au round suivant.",
    };
  }

  if (state.lastChallengeResult === null) {
    return {
      success: false,
      state,
      error: "Pas de résultat de challenge pour déterminer le prochain joueur.",
    };
  }

  // Le perdant du challenge (ou le joueur vivant suivant) commence
  const loserIndex = getPlayerIndex(
    state.players,
    state.lastChallengeResult.loserId,
  );
  const startingIndex = getStartingPlayerIndex(state.players, loserIndex);

  // Lancer les dés pour le nouveau round
  const rolledState = rollDiceForAllPlayers(
    {
      ...state,
      phase: GamePhase.ROLLING,
      round: state.round + 1,
      currentPlayerIndex: startingIndex,
      currentBid: null,
      lastChallengeResult: null,
      updatedAt: new Date().toISOString(),
    },
    random,
  );

  return {
    success: true,
    state: {
      ...rolledState,
      phase: GamePhase.BIDDING,
    },
  };
}

// =============================================================================
// Abandon (surrender)
// =============================================================================

/**
 * Un joueur abandonne la partie.
 * - Élimine le joueur (isAlive = false, diceCount = 0)
 * - Si un seul joueur reste en vie → GAME_OVER
 * - Sinon, la partie continue (le tour passe au suivant si c'était son tour)
 */
export function surrender(
  state: GameState,
  playerId: string,
): GameActionResult {
  // Vérifier que la partie est en cours
  if (
    state.phase !== GamePhase.BIDDING &&
    state.phase !== GamePhase.ROLLING &&
    state.phase !== GamePhase.RESULT &&
    state.phase !== GamePhase.CHALLENGE
  ) {
    return {
      success: false,
      state,
      error: "Impossible d'abandonner dans cette phase.",
    };
  }

  // Vérifier que le joueur est dans la partie et en vie
  const playerIndex = getPlayerIndex(state.players, playerId);
  if (playerIndex === -1) {
    return { success: false, state, error: "Joueur non trouvé." };
  }

  if (!state.players[playerIndex].isAlive) {
    return { success: false, state, error: "Vous êtes déjà éliminé." };
  }

  // Éliminer le joueur
  const updatedPlayers = state.players.map((p) =>
    p.id === playerId
      ? { ...p, isAlive: false, diceCount: 0, diceValues: [] as number[] }
      : p,
  );

  // Vérifier s'il reste un gagnant
  const winner = getWinner(updatedPlayers);

  if (winner) {
    // Partie terminée
    return {
      success: true,
      state: {
        ...state,
        players: updatedPlayers,
        phase: GamePhase.GAME_OVER,
        winnerId: winner.id,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  // La partie continue — ajuster le tour si c'était le tour du joueur qui abandonne
  let { currentPlayerIndex } = state;
  if (currentPlayerIndex === playerIndex) {
    // Trouver le prochain joueur vivant après l'index actuel
    let nextIndex = (currentPlayerIndex + 1) % updatedPlayers.length;
    while (!updatedPlayers[nextIndex].isAlive) {
      nextIndex = (nextIndex + 1) % updatedPlayers.length;
    }
    currentPlayerIndex = nextIndex;
  }

  return {
    success: true,
    state: {
      ...state,
      players: updatedPlayers,
      currentPlayerIndex,
      updatedAt: new Date().toISOString(),
    },
  };
}
