// =============================================================================
// TYPES — Contrats API (Request / Response)
// =============================================================================
// Définit les formes des requêtes et réponses des endpoints.
// Partagés entre le frontend (client API) et le backend (route handlers).
// =============================================================================

import type { GamePhase, GameMode, Bid, ChallengeResult, GameConfig } from "@/core/game-engine";

// =============================================================================
// Requêtes
// =============================================================================

export interface CreateGameRequest {
  displayName: string;
  /** Mode de jeu (par défaut PRIVATE pour les parties avec code) */
  gameMode?: GameMode;
}

export interface JoinGameRequest {
  joinCode: string;
  displayName: string;
}

export interface PlaceBidRequest {
  gameId: string;
  quantity: number;
  faceValue: number;
}

export interface CallChallengeRequest {
  gameId: string;
}

export interface SurrenderRequest {
  gameId: string;
}

export interface LeaveGameRequest {
  gameId: string;
}

export interface StartGameRequest {
  gameId: string;
}

export interface UpdateSettingsRequest {
  gameId: string;
  initialDiceCount?: 3 | 5 | 7;
  pacosAreWild?: boolean;
  turnTimer?: null | 15 | 30 | 60;
  maxPlayers?: number;
}

export interface NextRoundRequest {
  gameId: string;
}

// =============================================================================
// Réponses
// =============================================================================

/** Joueur tel qu'envoyé au client (les dés des AUTRES joueurs sont masqués) */
export interface PublicPlayerInfo {
  id: string;
  displayName: string;
  avatarUrl?: string;
  /** Tier d'abonnement (pour affichage du badge Premium) */
  subscription?: string;
  diceCount: number;
  /** Dés visibles uniquement pour le joueur lui-même */
  diceValues: number[];
  isAlive: boolean;
  isHost: boolean;
  seatIndex: number;
}

/** État du jeu tel qu'envoyé au client */
export interface PublicGameState {
  id: string;
  joinCode: string;
  gameMode: GameMode;
  config: GameConfig;
  players: PublicPlayerInfo[];
  currentPlayerIndex: number;
  phase: GamePhase;
  currentBid: Bid | null;
  round: number;
  lastChallengeResult: ChallengeResult | null;
  winnerId: string | null;
  /** Changements ELO (uniquement en RANKED, après GAME_OVER) */
  eloChanges?: EloChangeInfo[];
}

/** Info de changement ELO pour un joueur */
export interface EloChangeInfo {
  playerId: string;
  oldElo: number;
  newElo: number;
  delta: number;
}

/** Réponse générique de l'API */
export interface ApiResponse<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

export type CreateGameResponse = ApiResponse<{
  gameId: string;
  joinCode: string;
}>;

export type JoinGameResponse = ApiResponse<{
  gameId: string;
}>;

export type GameStateResponse = ApiResponse<PublicGameState>;

export type PlaceBidResponse = ApiResponse<PublicGameState>;

export type CallChallengeResponse = ApiResponse<PublicGameState>;

export type SurrenderResponse = ApiResponse<PublicGameState>;
export type UpdateSettingsResponse = ApiResponse<PublicGameState>;
export type LeaveGameResponse = ApiResponse<void>;

// =============================================================================
// Profil utilisateur
// =============================================================================

import type { SubscriptionTier } from "./database";

/** Profil public (visible par tous) */
export interface PublicProfile {
  id: string;
  pseudo: string;
  avatarUrl: string | null;
  elo1v1: number;
  elo4p: number;
  subscription: SubscriptionTier;
  gamesPlayed: number;
  gamesWon: number;
  bestWinStreak: number;
  isOnline: boolean;
}

/** Profil complet (visible uniquement par le propriétaire) */
export interface FullProfile extends PublicProfile {
  subscriptionExpiresAt: string | null;
  totalChallengeCalls: number;
  totalChallengeSuccess: number;
  currentWinStreak: number;
  lastSeenAt: string | null;
  createdAt: string;
}

/** Requête de mise à jour du profil */
export interface UpdateProfileRequest {
  pseudo?: string;
  avatarUrl?: string;
}

/** Un point dans l'historique ELO */
export interface EloHistoryEntry {
  elo: number;
  delta: number;
  gameId: string | null;
  /** Mode classé ('1v1' ou '4p') */
  rankedMode: string;
  createdAt: string;
}

export type ProfileResponse = ApiResponse<FullProfile>;
export type PublicProfileResponse = ApiResponse<PublicProfile>;
export type UpdateProfileResponse = ApiResponse<FullProfile>;
export type EloHistoryResponse = ApiResponse<EloHistoryEntry[]>;

// =============================================================================
// Matchmaking
// =============================================================================

/** Requête pour rejoindre la file d'attente */
export interface JoinQueueRequest {
  displayName: string;
  gameMode: "NORMAL" | "RANKED";
  /** Nombre de joueurs par partie (2 = 1v1, 4 = à 4) */
  playerCount: 2 | 4;
}

/** Requête pour quitter la file d'attente */
export interface LeaveQueueRequest {
  queueEntryId: string;
}

/** Statut de la file d'attente */
export interface QueueStatus {
  /** ID de l'entrée dans la file */
  entryId: string;
  /** Statut actuel */
  status: "waiting" | "matched" | "cancelled";
  /** ELO du joueur (pour le mode sélectionné) */
  elo: number;
  /** Mode de jeu */
  gameMode: "NORMAL" | "RANKED";
  /** Nombre de joueurs par partie (2 ou 4) */
  playerCount: 2 | 4;
  /** ID de la partie trouvée (si matched) */
  matchedGameId: string | null;
  /** Temps d'attente en secondes */
  waitTimeSeconds: number;
  /** Nombre de joueurs dans la file (même mode + même playerCount) */
  playersInQueue: number;
}

export type JoinQueueResponse = ApiResponse<{ entryId: string }>;
export type QueueStatusResponse = ApiResponse<QueueStatus>;
export type LeaveQueueResponse = ApiResponse<void>;

// =============================================================================
// Amis
// =============================================================================

/** Information sur un ami */
export interface FriendInfo {
  id: string;
  pseudo: string;
  avatarUrl: string | null;
  elo1v1: number;
  elo4p: number;
  isOnline: boolean;
  /** Statut de l'amitié */
  status: "pending" | "accepted";
  /** ID de la demande d'amitié */
  friendshipId: string;
  /** True si c'est l'utilisateur actuel qui a envoyé la demande */
  isRequester: boolean;
}

/** Requête pour ajouter un ami */
export interface AddFriendRequest {
  friendId: string;
}

/** Requête pour accepter/refuser une demande */
export interface RespondToFriendRequest {
  friendshipId: string;
  accept: boolean;
}

export type FriendsListResponse = ApiResponse<FriendInfo[]>;
export type AddFriendResponse = ApiResponse<{ friendshipId: string }>;
export type RespondToFriendRequestResponse = ApiResponse<void>;
export type RemoveFriendResponse = ApiResponse<void>;

// =============================================================================
// Messages privés
// =============================================================================

/** Un message privé */
export interface PrivateMessage {
  id: string;
  senderId: string;
  receiverId: string;
  senderPseudo: string;
  senderAvatarUrl: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
}

/** Requête pour envoyer un message */
export interface SendMessageRequest {
  receiverId: string;
  content: string;
}

/** Requête pour récupérer les messages d'une conversation */
export interface GetConversationRequest {
  friendId: string;
  limit?: number;
  before?: string; // Message ID pour la pagination
}

export type SendMessageResponse = ApiResponse<PrivateMessage>;
export type GetConversationResponse = ApiResponse<PrivateMessage[]>;
export type MarkMessagesReadResponse = ApiResponse<void>;

// =============================================================================
// Messages de partie (chat)
// =============================================================================

/** Un message dans le chat d'une partie */
export interface GameMessage {
  id: string;
  gameId: string;
  userId: string;
  userPseudo: string;
  userAvatarUrl: string | null;
  content: string;
  createdAt: string;
}

/** Requête pour envoyer un message dans une partie */
export interface SendGameMessageRequest {
  content: string;
}

export type SendGameMessageResponse = ApiResponse<GameMessage>;
export type GetGameMessagesResponse = ApiResponse<GameMessage[]>;

// =============================================================================
// Reports
// =============================================================================

import type { ReportRow } from "./database";

/** Requête pour créer un signalement */
export interface CreateReportRequest {
  reportType: "player" | "message";
  reportedUserId?: string;
  reportedMessageId?: string;
  reason: ReportRow["reason"];
  description?: string;
}

export type CreateReportResponse = ApiResponse<{ id: string }>;

/** Signalement retourné à l'admin */
export interface AdminReport {
  id: string;
  reportType: ReportRow["report_type"];
  reporterId: string;
  reportedUserId: string | null;
  reportedMessageId: string | null;
  reason: ReportRow["reason"];
  description: string | null;
  status: ReportRow["status"];
  adminNotes: string | null;
  createdAt: string;
}

export interface UpdateReportRequest {
  status?: ReportRow["status"];
  adminNotes?: string;
}

export type AdminReportsResponse = ApiResponse<{ rows: AdminReport[]; count: number }>;
export type UpdateReportResponse = ApiResponse<AdminReport>;
