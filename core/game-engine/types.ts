// =============================================================================
// CORE DOMAIN — Types purs du Game Engine
// =============================================================================
// Aucune dépendance externe. Ce fichier définit les modèles fondamentaux
// du jeu Dixo (Perudo / Liar's Dice).
// =============================================================================

/** Phases du jeu — Machine d'état */
export enum GamePhase {
  /** Salle d'attente avant le début de la partie */
  LOBBY = "LOBBY",
  /** Les joueurs lancent leurs dés */
  ROLLING = "ROLLING",
  /** Phase d'enchères — les joueurs misent sur le nombre total de dés */
  BIDDING = "BIDDING",
  /** Un joueur a contesté l'enchère — on révèle les dés */
  CHALLENGE = "CHALLENGE",
  /** Affichage du résultat du round */
  RESULT = "RESULT",
  /** La partie est terminée — un seul joueur reste */
  GAME_OVER = "GAME_OVER",
}

/** Enchère : quantité de dés d'une certaine face */
export interface Bid {
  /** Nombre de dés annoncé (ex: 3) */
  readonly quantity: number;
  /** Face du dé annoncée (1-6, le 1 = Paco/joker dans les règles du Perudo) */
  readonly faceValue: number;
  /** ID du joueur qui a fait l'enchère */
  readonly playerId: string;
}

/** État d'un joueur dans la partie */
export interface PlayerState {
  /** ID unique du joueur (correspond au user_id Supabase) */
  readonly id: string;
  /** Nom d'affichage */
  readonly displayName: string;
  /** URL de l'avatar (optionnel) */
  readonly avatarUrl?: string;
  /** Tier d'abonnement (pour affichage du badge, sans impact sur la logique) */
  readonly subscription?: string;
  /** Skin de dé sélectionné (nom du dossier dans /dices-skins/) */
  readonly diceSkin?: string;
  /** Nombre de dés restants (commence à 5 au Perudo) */
  readonly diceCount: number;
  /** Résultat du dernier lancer de dés (caché aux autres joueurs) */
  readonly diceValues: readonly number[];
  /** Le joueur est-il encore en jeu ? */
  readonly isAlive: boolean;
  /** Le joueur est-il le créateur de la partie ? */
  readonly isHost: boolean;
  /** Ordre de jeu */
  readonly seatIndex: number;
}

/** Résultat de la résolution d'un Challenge (contestation d'enchère) */
export interface ChallengeResult {
  /** ID du joueur qui a contesté */
  readonly callerId: string;
  /** ID du joueur qui avait fait la dernière enchère */
  readonly bidderId: string;
  /** L'enchère contestée */
  readonly contestedBid: Bid;
  /** Nombre réel de dés correspondant à la face */
  readonly actualCount: number;
  /** Le challenge était-il correct ? (l'enchère était-elle un bluff ?) */
  readonly isChallengeCorrect: boolean;
  /** ID du joueur qui perd un dé */
  readonly loserId: string;
  /** Snapshot des dés de chaque joueur au moment du challenge (avant pénalité) */
  readonly revealedDice: Record<string, readonly number[]>;
}

/** Mode de jeu */
export enum GameMode {
  /** Partie privée — invitation par code, aucun changement ELO */
  PRIVATE = "PRIVATE",
  /** Partie normale — matchmaking rapide, aucun changement ELO */
  NORMAL = "NORMAL",
  /** Partie classée — matchmaking par ELO, ELO impacté */
  RANKED = "RANKED",
}

/** Configuration d'une partie */
export interface GameConfig {
  /** Nombre minimum de joueurs pour démarrer */
  readonly minPlayers: number;
  /** Nombre maximum de joueurs */
  readonly maxPlayers: number;
  /** Nombre de dés par joueur au début */
  readonly initialDiceCount: number;
  /** Les Pacos (face 1) comptent-ils comme jokers ? */
  readonly pacosAreWild: boolean;
  /** Timer par tour en secondes (null = illimité) */
  readonly turnTimer: number | null;
}

/** Configuration par défaut */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  minPlayers: 2,
  maxPlayers: 6,
  initialDiceCount: 5,
  pacosAreWild: true,
  turnTimer: null,
} as const;

/** État complet du jeu — source de vérité */
export interface GameState {
  /** ID unique de la partie */
  readonly id: string;
  /** Code d'accès pour rejoindre la partie */
  readonly joinCode: string;
  /** Mode de jeu (PRIVATE, NORMAL, RANKED) */
  readonly gameMode: GameMode;
  /** Configuration de la partie */
  readonly config: GameConfig;
  /** Liste des joueurs */
  readonly players: readonly PlayerState[];
  /** Index du joueur dont c'est le tour */
  readonly currentPlayerIndex: number;
  /** Phase actuelle du jeu */
  readonly phase: GamePhase;
  /** Enchère courante (null si aucune enchère n'a été faite) */
  readonly currentBid: Bid | null;
  /** Numéro du round actuel */
  readonly round: number;
  /** Résultat du dernier Challenge (null si pas de challenge) */
  readonly lastChallengeResult: ChallengeResult | null;
  /** ID du joueur gagnant (null tant que la partie n'est pas finie) */
  readonly winnerId: string | null;
  /** Timestamp de création */
  readonly createdAt: string;
  /** Timestamp de dernière mise à jour */
  readonly updatedAt: string;
}

/** Résultat d'une action du game engine */
export interface GameActionResult {
  readonly success: boolean;
  readonly state: GameState;
  readonly error?: string;
}

/** Événements possibles du jeu (pour la state machine) */
export enum GameEvent {
  PLAYER_JOIN = "PLAYER_JOIN",
  PLAYER_LEAVE = "PLAYER_LEAVE",
  START_GAME = "START_GAME",
  ROLL_DICE = "ROLL_DICE",
  PLACE_BID = "PLACE_BID",
  CALL_CHALLENGE = "CALL_CHALLENGE",
  RESOLVE_CHALLENGE = "RESOLVE_CHALLENGE",
  NEXT_ROUND = "NEXT_ROUND",
  SURRENDER = "SURRENDER",
  GAME_OVER = "GAME_OVER",
}
