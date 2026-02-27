// =============================================================================
// TESTS — Machine d'état du jeu (state machine)
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  createInitialGameState,
  addPlayer,
  removePlayer,
  startGame,
  placeBid,
  callChallenge,
  startNextRound,
  surrender,
} from "@/core/game-engine/state-machine";
import { GamePhase, GameMode, DEFAULT_GAME_CONFIG } from "@/core/game-engine/types";

// Générateur déterministe : tous les dés valent 3
function fixedRandom() {
  return 0.4; // Math.floor(0.4 * 6) + 1 = 3
}

describe("createInitialGameState", () => {
  it("crée un état en phase LOBBY avec l'hôte", () => {
    const state = createInitialGameState("game-1", {
      id: "host-1",
      displayName: "Alice",
    });

    expect(state.id).toBe("game-1");
    expect(state.phase).toBe(GamePhase.LOBBY);
    expect(state.players).toHaveLength(1);
    expect(state.players[0].id).toBe("host-1");
    expect(state.players[0].isHost).toBe(true);
    expect(state.players[0].diceCount).toBe(DEFAULT_GAME_CONFIG.initialDiceCount);
    expect(state.round).toBe(0);
    expect(state.joinCode).toHaveLength(6);
  });
});

describe("addPlayer", () => {
  it("ajoute un joueur au lobby", () => {
    const state = createInitialGameState("game-1", {
      id: "host-1",
      displayName: "Alice",
    });

    const result = addPlayer(state, { id: "p2", displayName: "Bob" });

    expect(result.success).toBe(true);
    expect(result.state.players).toHaveLength(2);
    expect(result.state.players[1].id).toBe("p2");
    expect(result.state.players[1].isHost).toBe(false);
  });

  it("refuse l'ajout si la partie a commencé", () => {
    const state = createInitialGameState("game-1", {
      id: "host-1",
      displayName: "Alice",
    });

    const result = addPlayer(
      { ...state, phase: GamePhase.BIDDING },
      { id: "p2", displayName: "Bob" },
    );

    expect(result.success).toBe(false);
  });

  it("refuse les doublons", () => {
    const state = createInitialGameState("game-1", {
      id: "host-1",
      displayName: "Alice",
    });

    const result = addPlayer(state, { id: "host-1", displayName: "Alice" });
    expect(result.success).toBe(false);
  });

  it("refuse quand la partie est pleine", () => {
    let state = createInitialGameState("game-1", {
      id: "host-1",
      displayName: "Alice",
    }, GameMode.PRIVATE, { ...DEFAULT_GAME_CONFIG, maxPlayers: 2 });

    const result1 = addPlayer(state, { id: "p2", displayName: "Bob" });
    expect(result1.success).toBe(true);
    state = result1.state;

    const result2 = addPlayer(state, { id: "p3", displayName: "Charlie" });
    expect(result2.success).toBe(false);
  });
});

describe("removePlayer", () => {
  it("retire un joueur du lobby", () => {
    let state = createInitialGameState("game-1", {
      id: "host-1",
      displayName: "Alice",
    });
    state = addPlayer(state, { id: "p2", displayName: "Bob" }).state;

    const result = removePlayer(state, "p2");
    expect(result.success).toBe(true);
    expect(result.state.players).toHaveLength(1);
  });

  it("refuse de retirer l'hôte", () => {
    const state = createInitialGameState("game-1", {
      id: "host-1",
      displayName: "Alice",
    });

    const result = removePlayer(state, "host-1");
    expect(result.success).toBe(false);
  });
});

describe("startGame", () => {
  it("démarre la partie et lance les dés", () => {
    let state = createInitialGameState("game-1", {
      id: "host-1",
      displayName: "Alice",
    });
    state = addPlayer(state, { id: "p2", displayName: "Bob" }).state;

    const result = startGame(state, "host-1", fixedRandom);

    expect(result.success).toBe(true);
    expect(result.state.phase).toBe(GamePhase.BIDDING);
    expect(result.state.round).toBe(1);
    // Tous les dés devraient valoir 3 avec notre random fixe
    expect(result.state.players[0].diceValues.every((d) => d === 3)).toBe(true);
    expect(result.state.players[1].diceValues.every((d) => d === 3)).toBe(true);
  });

  it("refuse si ce n'est pas l'hôte", () => {
    let state = createInitialGameState("game-1", {
      id: "host-1",
      displayName: "Alice",
    });
    state = addPlayer(state, { id: "p2", displayName: "Bob" }).state;

    const result = startGame(state, "p2");
    expect(result.success).toBe(false);
  });

  it("refuse s'il n'y a pas assez de joueurs", () => {
    const state = createInitialGameState("game-1", {
      id: "host-1",
      displayName: "Alice",
    });

    const result = startGame(state, "host-1");
    expect(result.success).toBe(false);
  });
});

describe("placeBid", () => {
  it("place une enchère et avance au joueur suivant", () => {
    const state = createBiddingState();

    const result = placeBid(state, {
      playerId: "p1",
      quantity: 2,
      faceValue: 3,
    });

    expect(result.success).toBe(true);
    expect(result.state.currentBid).toEqual({
      playerId: "p1",
      quantity: 2,
      faceValue: 3,
    });
    expect(result.state.currentPlayerIndex).toBe(1); // tour de p2
  });

  it("refuse une enchère inférieure", () => {
    const state = {
      ...createBiddingState(),
      currentBid: { playerId: "p2", quantity: 3, faceValue: 4 },
      currentPlayerIndex: 0,
    };

    const result = placeBid(state, {
      playerId: "p1",
      quantity: 2,
      faceValue: 3,
    });

    expect(result.success).toBe(false);
  });
});

describe("callChallenge", () => {
  it("résout un Challenge correct (bluff détecté)", () => {
    // P1 a enchéri 5 dés de face 6, P2 conteste
    // P1 a [3,3,3,3,3], P2 a [3,3,3,3,3] → 0 dés de face 6
    const state = {
      ...createBiddingState(),
      currentBid: { playerId: "p1", quantity: 5, faceValue: 6 },
      currentPlayerIndex: 1,
    };

    const result = callChallenge(state, "p2");

    expect(result.success).toBe(true);
    expect(result.state.lastChallengeResult).not.toBeNull();
    expect(result.state.lastChallengeResult!.isChallengeCorrect).toBe(true);
    expect(result.state.lastChallengeResult!.loserId).toBe("p1");
    expect(result.state.phase).toBe(GamePhase.RESULT);
  });

  it("résout un Challenge incorrect (enchère valide)", () => {
    // P1 a enchéri 2 dés de face 3, P2 conteste
    // Tous les dés valent 3 → 10 dés de face 3
    const state = {
      ...createBiddingState(),
      currentBid: { playerId: "p1", quantity: 2, faceValue: 3 },
      currentPlayerIndex: 1,
    };

    const result = callChallenge(state, "p2");

    expect(result.success).toBe(true);
    expect(result.state.lastChallengeResult!.isChallengeCorrect).toBe(false);
    expect(result.state.lastChallengeResult!.loserId).toBe("p2");
  });

  it("détecte la fin de partie", () => {
    // P2 n'a plus qu'un dé, enchère de P1 est valide → P2 conteste mais perd
    const state = {
      ...createBiddingState(),
      currentBid: { playerId: "p1", quantity: 1, faceValue: 3 },
      currentPlayerIndex: 1,
      players: [
        {
          id: "p1",
          displayName: "Alice",
          diceCount: 5,
          diceValues: [3, 3, 3, 3, 3],
          isAlive: true,
          isHost: true,
          seatIndex: 0,
        },
        {
          id: "p2",
          displayName: "Bob",
          diceCount: 1,
          diceValues: [3],
          isAlive: true,
          isHost: false,
          seatIndex: 1,
        },
      ],
    };

    // enchère "1 dé de face 3" → il y en a 6, Challenge incorrect, p2 perd son dernier dé
    const result = callChallenge(state, "p2");

    expect(result.success).toBe(true);
    expect(result.state.lastChallengeResult!.loserId).toBe("p2");
    expect(result.state.phase).toBe(GamePhase.GAME_OVER);
    expect(result.state.winnerId).toBe("p1");
  });
});

describe("startNextRound", () => {
  it("passe au round suivant après un résultat", () => {
    const state = createResultState();

    const result = startNextRound(state, fixedRandom);

    expect(result.success).toBe(true);
    expect(result.state.phase).toBe(GamePhase.BIDDING);
    expect(result.state.round).toBe(2);
    expect(result.state.currentBid).toBeNull();
    expect(result.state.lastChallengeResult).toBeNull();
  });

  it("refuse si on n'est pas en phase RESULT", () => {
    const state = createBiddingState();
    const result = startNextRound(state);
    expect(result.success).toBe(false);
  });
});

describe("surrender", () => {
  it("élimine le joueur et fait gagner l'adversaire (2 joueurs)", () => {
    const state = createBiddingState();

    const result = surrender(state, "p1");

    expect(result.success).toBe(true);
    expect(result.state.phase).toBe(GamePhase.GAME_OVER);
    expect(result.state.winnerId).toBe("p2");
    expect(result.state.players[0].isAlive).toBe(false);
    expect(result.state.players[0].diceCount).toBe(0);
    expect(result.state.players[1].isAlive).toBe(true);
  });

  it("continue la partie avec 3+ joueurs si 2+ restent vivants", () => {
    const state = createThreePlayerBiddingState();

    const result = surrender(state, "p2");

    expect(result.success).toBe(true);
    expect(result.state.phase).toBe(GamePhase.BIDDING);
    expect(result.state.winnerId).toBeNull();
    expect(result.state.players.filter((p) => p.isAlive)).toHaveLength(2);
    expect(result.state.players[1].isAlive).toBe(false);
  });

  it("avance le tour si c'était au joueur qui abandonne de jouer", () => {
    const state = {
      ...createBiddingState(),
      currentPlayerIndex: 0,
      // 3 joueurs pour ne pas déclencher GAME_OVER
      players: [
        { id: "p1", displayName: "Alice", diceCount: 5, diceValues: [3, 3, 3, 3, 3] as readonly number[], isAlive: true, isHost: true, seatIndex: 0 },
        { id: "p2", displayName: "Bob", diceCount: 5, diceValues: [3, 3, 3, 3, 3] as readonly number[], isAlive: true, isHost: false, seatIndex: 1 },
        { id: "p3", displayName: "Charlie", diceCount: 5, diceValues: [3, 3, 3, 3, 3] as readonly number[], isAlive: true, isHost: false, seatIndex: 2 },
      ] as const,
    };

    const result = surrender(state, "p1");

    expect(result.success).toBe(true);
    // Le tour devrait passer au joueur suivant vivant (p2)
    expect(result.state.currentPlayerIndex).toBe(1);
  });

  it("refuse en phase LOBBY", () => {
    const state = createInitialGameState("game-1", {
      id: "host-1",
      displayName: "Alice",
    });

    const result = surrender(state, "host-1");

    expect(result.success).toBe(false);
    expect(result.state.phase).toBe(GamePhase.LOBBY);
  });

  it("refuse si le joueur est déjà éliminé", () => {
    const state = {
      ...createBiddingState(),
      players: [
        { id: "p1", displayName: "Alice", diceCount: 0, diceValues: [] as readonly number[], isAlive: false, isHost: true, seatIndex: 0 },
        { id: "p2", displayName: "Bob", diceCount: 5, diceValues: [3, 3, 3, 3, 3] as readonly number[], isAlive: true, isHost: false, seatIndex: 1 },
        { id: "p3", displayName: "Charlie", diceCount: 5, diceValues: [3, 3, 3, 3, 3] as readonly number[], isAlive: true, isHost: false, seatIndex: 2 },
      ] as const,
    };

    const result = surrender(state, "p1");
    expect(result.success).toBe(false);
  });

  it("refuse si le joueur n'est pas dans la partie", () => {
    const state = createBiddingState();

    const result = surrender(state, "unknown-player");
    expect(result.success).toBe(false);
  });

  it("fonctionne en phase RESULT", () => {
    const state = {
      ...createResultState(),
      // 3 joueurs pour que l'abandon ne finisse pas la partie
      players: [
        { id: "p1", displayName: "Alice", diceCount: 4, diceValues: [] as readonly number[], isAlive: true, isHost: true, seatIndex: 0 },
        { id: "p2", displayName: "Bob", diceCount: 5, diceValues: [] as readonly number[], isAlive: true, isHost: false, seatIndex: 1 },
        { id: "p3", displayName: "Charlie", diceCount: 5, diceValues: [] as readonly number[], isAlive: true, isHost: false, seatIndex: 2 },
      ] as const,
    };

    const result = surrender(state, "p3");
    expect(result.success).toBe(true);
    expect(result.state.players[2].isAlive).toBe(false);
  });
});

// =============================================================================
// Helpers
// =============================================================================

function createBiddingState() {
  return {
    id: "test-game",
    joinCode: "ABC123",
    gameMode: GameMode.PRIVATE,
    config: DEFAULT_GAME_CONFIG,
    players: [
      {
        id: "p1",
        displayName: "Alice",
        diceCount: 5,
        diceValues: [3, 3, 3, 3, 3] as readonly number[],
        isAlive: true,
        isHost: true,
        seatIndex: 0,
      },
      {
        id: "p2",
        displayName: "Bob",
        diceCount: 5,
        diceValues: [3, 3, 3, 3, 3] as readonly number[],
        isAlive: true,
        isHost: false,
        seatIndex: 1,
      },
    ] as const,
    currentPlayerIndex: 0,
    phase: GamePhase.BIDDING as const,
    currentBid: null,
    round: 1,
    lastChallengeResult: null,
    winnerId: null,
    createdAt: "",
    updatedAt: "",
  };
}

function createThreePlayerBiddingState() {
  return {
    ...createBiddingState(),
    players: [
      {
        id: "p1",
        displayName: "Alice",
        diceCount: 5,
        diceValues: [3, 3, 3, 3, 3] as readonly number[],
        isAlive: true,
        isHost: true,
        seatIndex: 0,
      },
      {
        id: "p2",
        displayName: "Bob",
        diceCount: 5,
        diceValues: [3, 3, 3, 3, 3] as readonly number[],
        isAlive: true,
        isHost: false,
        seatIndex: 1,
      },
      {
        id: "p3",
        displayName: "Charlie",
        diceCount: 5,
        diceValues: [3, 3, 3, 3, 3] as readonly number[],
        isAlive: true,
        isHost: false,
        seatIndex: 2,
      },
    ] as const,
  };
}

function createResultState() {
  return {
    ...createBiddingState(),
    phase: GamePhase.RESULT as const,
    round: 1,
    lastChallengeResult: {
      callerId: "p2",
      bidderId: "p1",
      contestedBid: { playerId: "p1", quantity: 5, faceValue: 6 },
      actualCount: 0,
      isChallengeCorrect: true,
      loserId: "p1",
    },
    players: [
      {
        id: "p1",
        displayName: "Alice",
        diceCount: 4,
        diceValues: [] as readonly number[],
        isAlive: true,
        isHost: true,
        seatIndex: 0,
      },
      {
        id: "p2",
        displayName: "Bob",
        diceCount: 5,
        diceValues: [] as readonly number[],
        isAlive: true,
        isHost: false,
        seatIndex: 1,
      },
    ] as const,
  };
}
