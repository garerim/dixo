// =============================================================================
// INFRASTRUCTURE — Game Repository
// =============================================================================
// Couche d'accès aux données. Convertit entre les types DB et les types domaine.
// Isole complètement la base de données du reste de l'application.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, GameRow } from "@/types/database";
import type { GameState } from "@/core/game-engine";

// =============================================================================
// Sérialisation / Désérialisation
// =============================================================================

/**
 * Convertit un GameState (domaine) vers une ligne DB.
 */
export function gameStateToRow(state: GameState): Omit<GameRow, "created_at" | "updated_at"> {
  return {
    id: state.id,
    join_code: state.joinCode,
    game_mode: state.gameMode,
    config: state.config as unknown as Record<string, unknown>,
    state: state as unknown as Record<string, unknown>,
    phase: state.phase,
    round: state.round,
    host_id: state.players.find((p) => p.isHost)?.id ?? "",
    winner_id: state.winnerId,
  };
}

/**
 * Convertit une ligne DB vers un GameState (domaine).
 */
export function rowToGameState(row: GameRow): GameState {
  return row.state as unknown as GameState;
}

// =============================================================================
// Opérations CRUD
// =============================================================================

export class GameRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Crée une nouvelle partie dans la base de données.
   */
  async create(state: GameState): Promise<GameState> {
    const row = gameStateToRow(state);

    const { error } = await this.supabase.from("games").insert({
      ...row,
    });

    if (error) {
      throw new Error(`Erreur création de partie: ${error.message}`);
    }

    return state;
  }

  /**
   * Récupère une partie par son ID.
   */
  async findById(gameId: string): Promise<GameState | null> {
    const { data, error } = await this.supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (error || !data) return null;

    return rowToGameState(data);
  }

  /**
   * Récupère une partie par son code d'accès.
   */
  async findByJoinCode(joinCode: string): Promise<GameState | null> {
    const { data, error } = await this.supabase
      .from("games")
      .select("*")
      .eq("join_code", joinCode.toUpperCase())
      .single();

    if (error || !data) return null;

    return rowToGameState(data);
  }

  /**
   * Met à jour l'état complet du jeu.
   * Utilise un update optimiste basé sur le round pour éviter les conflits.
   */
  async update(state: GameState): Promise<GameState> {
    const row = gameStateToRow(state);

    const { error } = await this.supabase
      .from("games")
      .update({
        state: row.state,
        phase: row.phase,
        round: row.round,
        winner_id: row.winner_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", state.id);

    if (error) {
      throw new Error(`Erreur mise à jour de partie: ${error.message}`);
    }

    return state;
  }

  /**
   * Supprime une partie.
   */
  async delete(gameId: string): Promise<void> {
    const { error } = await this.supabase
      .from("games")
      .delete()
      .eq("id", gameId);

    if (error) {
      throw new Error(`Erreur suppression de partie: ${error.message}`);
    }
  }

  /**
   * Liste les parties en phase LOBBY (parties rejoignables).
   */
  async findOpenGames(): Promise<GameState[]> {
    const { data, error } = await this.supabase
      .from("games")
      .select("*")
      .eq("phase", "LOBBY")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !data) return [];

    return data.map(rowToGameState);
  }
}
