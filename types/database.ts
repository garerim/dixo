// =============================================================================
// TYPES — Modèles de la base de données (Supabase / PostgreSQL)
// =============================================================================
// Correspondance entre les tables Supabase et les types TypeScript.
// Ces types sont utilisés par la couche infrastructure (repositories).
// =============================================================================

/** Mode de jeu */
export type GameModeDB = "PRIVATE" | "NORMAL" | "RANKED";

/** Ligne de la table `games` */
export interface GameRow {
  id: string;
  join_code: string;
  game_mode: GameModeDB;
  config: Record<string, unknown>;
  state: Record<string, unknown>; // GameState sérialisé en JSON
  phase: string;
  round: number;
  host_id: string;
  winner_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Ligne de la table `matchmaking_queue` */
export interface MatchmakingQueueRow {
  id: string;
  user_id: string;
  elo: number;
  game_mode: GameModeDB;
  player_count: number;
  status: "waiting" | "matched" | "cancelled";
  matched_game_id: string | null;
  joined_at: string;
  updated_at: string;
}

/** Ligne de la table `game_players` */
export interface GamePlayerRow {
  id: string;
  game_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  seat_index: number;
  dice_count: number;
  dice_values: number[]; // Stocké chiffré côté serveur
  is_alive: boolean;
  is_host: boolean;
  joined_at: string;
}

/** Tiers d'abonnement */
export type SubscriptionTier = "free" | "premium" | "vip";

/** Ligne de la table `profiles` */
export interface ProfileRow {
  id: string;

  // Identité
  pseudo: string;
  avatar_url: string | null;

  // Classement
  elo_1v1: number;
  elo_4p: number;

  // Abonnement
  subscription: SubscriptionTier;
  subscription_expires_at: string | null;

  // Statistiques
  games_played: number;
  games_won: number;
  total_challenge_calls: number;
  total_challenge_success: number;
  best_win_streak: number;
  current_win_streak: number;

  // Métadonnées
  is_online: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Ligne de la table `elo_history` */
export interface EloHistoryRow {
  id: string;
  user_id: string;
  elo: number;
  delta: number;
  game_id: string | null;
  /** Mode classé ('1v1' ou '4p') */
  ranked_mode: string;
  created_at: string;
}

/** Statut d'une amitié */
export type FriendshipStatus = "pending" | "accepted" | "blocked";

/** Ligne de la table `friendships` */
export interface FriendshipRow {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

/** Ligne de la table `private_messages` */
export interface MessageRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

/** Types générés pour la base Supabase */
export interface Database {
  public: {
    Tables: {
      games: {
        Row: GameRow;
        Insert: Omit<GameRow, "created_at" | "updated_at">;
        Update: Partial<GameRow>;
      };
      game_players: {
        Row: GamePlayerRow;
        Insert: Omit<GamePlayerRow, "id" | "joined_at">;
        Update: Partial<GamePlayerRow>;
      };
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at" | "updated_at">;
        Update: Partial<ProfileRow>;
      };
      matchmaking_queue: {
        Row: MatchmakingQueueRow;
        Insert: Omit<MatchmakingQueueRow, "id" | "joined_at" | "updated_at">;
        Update: Partial<MatchmakingQueueRow>;
      };
      elo_history: {
        Row: EloHistoryRow;
        Insert: Omit<EloHistoryRow, "id" | "created_at">;
        Update: Partial<EloHistoryRow>;
      };
      friendships: {
        Row: FriendshipRow;
        Insert: Omit<FriendshipRow, "id" | "created_at" | "updated_at">;
        Update: Partial<FriendshipRow>;
      };
      private_messages: {
        Row: MessageRow;
        Insert: Omit<MessageRow, "id" | "created_at">;
        Update: Partial<MessageRow>;
      };
    };
  };
}
