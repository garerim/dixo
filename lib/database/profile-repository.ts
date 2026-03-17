// =============================================================================
// INFRASTRUCTURE — Profile Repository
// =============================================================================
// Couche d'accès aux données pour les profils utilisateurs.
// Isole la base de données du reste de l'application.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProfileRow, SubscriptionTier } from "@/types/database";

// =============================================================================
// Opérations CRUD
// =============================================================================

export class ProfileRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Récupère un profil par son ID (auth.users.id).
   */
  async findById(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) return null;

    return data;
  }

  /**
   * Récupère un profil par son pseudo.
   */
  async findByPseudo(pseudo: string): Promise<ProfileRow | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("pseudo", pseudo)
      .single();

    if (error || !data) return null;

    return data;
  }

  /**
   * Vérifie si un pseudo est déjà pris.
   */
  async isPseudoTaken(pseudo: string, excludeUserId?: string): Promise<boolean> {
    let query = this.supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("pseudo", pseudo);

    if (excludeUserId) {
      query = query.neq("id", excludeUserId);
    }

    const { count } = await query;

    return (count ?? 0) > 0;
  }

  /**
   * Met à jour le profil d'un utilisateur.
   * Seuls les champs fournis seront mis à jour.
   */
  async update(
    userId: string,
    data: Partial<Pick<ProfileRow, "pseudo" | "avatar_url" | "dice_skin" | "is_online" | "last_seen_at">>,
  ): Promise<ProfileRow | null> {
    const { data: updated, error } = await this.supabase
      .from("profiles")
      .update(data)
      .eq("id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(`Erreur mise à jour du profil: ${error.message}`);
    }

    return updated;
  }

  /**
   * Met à jour les statistiques après une partie.
   */
  async updateStats(
    userId: string,
    stats: {
      gamesPlayed?: number;
      gamesWon?: number;
      totalChallengeCalls?: number;
      totalChallengeSuccess?: number;
      currentWinStreak?: number;
      bestWinStreak?: number;
      elo1v1?: number;
      elo4p?: number;
    },
  ): Promise<ProfileRow | null> {
    const updateData: Partial<ProfileRow> = {};

    if (stats.gamesPlayed !== undefined) updateData.games_played = stats.gamesPlayed;
    if (stats.gamesWon !== undefined) updateData.games_won = stats.gamesWon;
    if (stats.totalChallengeCalls !== undefined) updateData.total_challenge_calls = stats.totalChallengeCalls;
    if (stats.totalChallengeSuccess !== undefined) updateData.total_challenge_success = stats.totalChallengeSuccess;
    if (stats.currentWinStreak !== undefined) updateData.current_win_streak = stats.currentWinStreak;
    if (stats.bestWinStreak !== undefined) updateData.best_win_streak = stats.bestWinStreak;
    if (stats.elo1v1 !== undefined) updateData.elo_1v1 = stats.elo1v1;
    if (stats.elo4p !== undefined) updateData.elo_4p = stats.elo4p;

    const { data: updated, error } = await this.supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(`Erreur mise à jour des stats: ${error.message}`);
    }

    return updated;
  }

  /**
   * Récupère le classement par ELO (top N).
   */
  async getLeaderboard(
    limit: number = 50,
    mode: "1v1" | "4p" = "1v1",
  ): Promise<ProfileRow[]> {
    const orderColumn = mode === "1v1" ? "elo_1v1" : "elo_4p";
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .order(orderColumn, { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data;
  }

  /**
   * Recherche de profils par pseudo (recherche partielle).
   */
  async searchByPseudo(query: string, limit: number = 10): Promise<ProfileRow[]> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .ilike("pseudo", `%${query}%`)
      .limit(limit);

    if (error || !data) return [];

    return data;
  }

  /**
   * Récupère un profil par son stripe_customer_id.
   */
  async findByStripeCustomerId(stripeCustomerId: string): Promise<ProfileRow | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();

    if (error || !data) return null;

    return data;
  }

  /**
   * Enregistre le stripe_customer_id sur le profil.
   */
  async updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (this.supabase.from("profiles") as any)
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", userId);

    if (error) {
      throw new Error(`Erreur mise à jour stripe_customer_id: ${error.message}`);
    }
  }

  /**
   * Met à jour le tier d'abonnement et la date d'expiration.
   */
  async updateSubscription(
    userId: string,
    tier: SubscriptionTier,
    expiresAt: string | null,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (this.supabase.from("profiles") as any)
      .update({
        subscription: tier,
        subscription_expires_at: expiresAt,
      })
      .eq("id", userId);

    if (error) {
      throw new Error(`Erreur mise à jour abonnement: ${error.message}`);
    }
  }

  /**
   * Marque un utilisateur comme en ligne / hors ligne.
   */
  async setOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const { error } = await this.supabase
      .from("profiles")
      .update({
        is_online: isOnline,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      throw new Error(`Erreur mise à jour du statut: ${error.message}`);
    }
  }
}
