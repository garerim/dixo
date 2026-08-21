// =============================================================================
// TYPES — Modèles de la base de données (Supabase / PostgreSQL)
// =============================================================================
// Correspondance entre les tables Supabase et les types TypeScript.
// Ces types sont utilisés par la couche infrastructure (repositories).
// =============================================================================

/** Mode de jeu */
export type GameModeDB = "PRIVATE" | "NORMAL" | "RANKED";

/** Ligne de la table `games` */
export type GameRow = {
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
};

/** Ligne de la table `matchmaking_queue` */
export type MatchmakingQueueRow = {
  id: string;
  user_id: string;
  elo: number;
  game_mode: GameModeDB;
  player_count: number;
  status: "waiting" | "matched" | "cancelled";
  matched_game_id: string | null;
  joined_at: string;
  updated_at: string;
};

/** Ligne de la table `game_players` */
export type GamePlayerRow = {
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
};

/** Tiers d'abonnement */
export type SubscriptionTier = "free" | "premium" | "vip";

/** Ligne de la table `profiles` */
export type ProfileRow = {
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

  // Bluffs consécutifs (pour achievement Bluff Master)
  consecutive_bluff_wins: number;

  // Tournois
  tournaments_played: number;
  tournaments_won: number;

  // Personnalisation
  dice_skin: string | null;

  // Stripe
  stripe_customer_id: string | null;

  // Admin
  is_admin: boolean;

  // Métadonnées
  is_online: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Ligne de la table `elo_history` */
export type EloHistoryRow = {
  id: string;
  user_id: string;
  elo: number;
  delta: number;
  game_id: string | null;
  tournament_id: string | null;
  /** Mode classé ('1v1' ou '4p') */
  ranked_mode: string;
  created_at: string;
};

/** Statut d'une amitié */
export type FriendshipStatus = "pending" | "accepted" | "blocked";

/** Ligne de la table `friendships` */
export type FriendshipRow = {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
};

/** Ligne de la table `private_messages` */
export type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

/** Ligne de la table `game_messages` */
export type GameMessageRow = {
  id: string;
  game_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

/** Ligne de la table `reports` */
export type ReportRow = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_message_id: string | null;
  report_type: "player" | "message";
  reason: "inappropriate_content" | "harassment" | "cheating" | "spam" | "other";
  description: string | null;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

/** Ligne de la table `user_skins` */
export type UserSkinRow = {
  id: string;
  user_id: string;
  skin_id: string;
  purchased_at: string;
  stripe_session_id: string | null;
};

/** Type de notification */
export type NotificationType =
  | "friend_request_received"
  | "friend_request_accepted"
  | "message_received"
  | "game_invite_received"
  | "game_started"
  | "achievement_unlocked";

/** Ligne de la table `notifications` */
export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};

/** Ligne de la table `user_achievements` */
export type UserAchievementRow = {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: Record<string, unknown>;
  unlocked_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Statut de tournoi */
export type TournamentStatusDB =
  | "registration"
  | "starting"
  | "in_progress"
  | "completed"
  | "cancelled";

/** Format de tournoi */
export type TournamentFormatDB = "single_elimination" | "double_elimination";

/** Ligne de la table `tournaments` */
export type TournamentRow = {
  id: string;
  name: string;
  format: TournamentFormatDB;
  status: TournamentStatusDB;
  max_participants: number;
  game_config: Record<string, unknown>;
  registration_deadline: string;
  started_at: string | null;
  completed_at: string | null;
  bracket: Record<string, unknown>;
  current_round: number;
  created_by: string | null;
  winner_id: string | null;
  reward_skin_id: string | null;
  elo_bonus_winner: number;
  elo_bonus_finalist: number;
  elo_bonus_semifinalist: number;
  is_automatic: boolean;
  created_at: string;
  updated_at: string;
};

/** Ligne de la table `tournament_participants` */
export type TournamentParticipantRow = {
  id: string;
  tournament_id: string;
  user_id: string;
  seed: number | null;
  is_eliminated: boolean;
  final_placement: number | null;
  registered_at: string;
};

/** Ligne de la table `tournament_matches` */
export type TournamentMatchRow = {
  id: string;
  tournament_id: string;
  game_id: string | null;
  round: number;
  match_index: number;
  bracket_side: string;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

/** Types générés pour la base Supabase */
export interface Database {
  public: {
    Tables: {
      games: {
        Row: GameRow;
        Insert: Omit<GameRow, "created_at" | "updated_at">;
        Update: Partial<GameRow>;
        Relationships: [];
      };
      game_players: {
        Row: GamePlayerRow;
        Insert: Omit<GamePlayerRow, "id" | "joined_at">;
        Update: Partial<GamePlayerRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at" | "updated_at">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      matchmaking_queue: {
        Row: MatchmakingQueueRow;
        Insert: Omit<MatchmakingQueueRow, "id" | "joined_at" | "updated_at">;
        Update: Partial<MatchmakingQueueRow>;
        Relationships: [];
      };
      elo_history: {
        Row: EloHistoryRow;
        Insert: Omit<EloHistoryRow, "id" | "created_at">;
        Update: Partial<EloHistoryRow>;
        Relationships: [];
      };
      friendships: {
        Row: FriendshipRow;
        Insert: Omit<FriendshipRow, "id" | "created_at" | "updated_at">;
        Update: Partial<FriendshipRow>;
        Relationships: [];
      };
      private_messages: {
        Row: MessageRow;
        Insert: Omit<MessageRow, "id" | "created_at">;
        Update: Partial<MessageRow>;
        Relationships: [];
      };
      game_messages: {
        Row: GameMessageRow;
        Insert: Omit<GameMessageRow, "id" | "created_at">;
        Update: Partial<GameMessageRow>;
        Relationships: [];
      };
      reports: {
        Row: ReportRow;
        Insert: Omit<ReportRow, "id" | "status" | "admin_notes" | "created_at" | "updated_at">;
        Update: Partial<ReportRow>;
        Relationships: [];
      };
      user_skins: {
        Row: UserSkinRow;
        Insert: Omit<UserSkinRow, "id" | "purchased_at">;
        Update: Partial<UserSkinRow>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Omit<NotificationRow, "id" | "created_at">;
        Update: Partial<NotificationRow>;
        Relationships: [];
      };
      user_achievements: {
        Row: UserAchievementRow;
        // updated_at optionnel : la colonne a un défaut, mais l'upsert la
        // rafraîchit explicitement lors d'une mise à jour de progression.
        Insert: Omit<UserAchievementRow, "id" | "created_at" | "updated_at"> & {
          updated_at?: string;
        };
        Update: Partial<UserAchievementRow>;
        Relationships: [];
      };
      tournaments: {
        Row: TournamentRow;
        Insert: Omit<TournamentRow, "id" | "created_at" | "updated_at"> & {
          started_at?: string | null;
          completed_at?: string | null;
          winner_id?: string | null;
          reward_skin_id?: string | null;
        };
        Update: Partial<TournamentRow>;
        Relationships: [];
      };
      tournament_participants: {
        Row: TournamentParticipantRow;
        Insert: Omit<TournamentParticipantRow, "id" | "registered_at" | "seed" | "is_eliminated" | "final_placement"> & {
          seed?: number | null;
          is_eliminated?: boolean;
          final_placement?: number | null;
        };
        Update: Partial<TournamentParticipantRow>;
        Relationships: [];
      };
      tournament_matches: {
        Row: TournamentMatchRow;
        Insert: Omit<TournamentMatchRow, "id" | "created_at" | "updated_at"> & {
          game_id?: string | null;
          player1_id?: string | null;
          player2_id?: string | null;
          winner_id?: string | null;
          status?: string;
        };
        Update: Partial<TournamentMatchRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      match_queue_entries: {
        Args: { p_entry_ids: string[]; p_game_id: string };
        Returns: undefined;
      };
    };
  };
}
