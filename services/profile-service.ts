// =============================================================================
// SERVICE — Profile Service (Orchestration)
// =============================================================================
// Couche application pour la gestion des profils utilisateurs.
// Orchestre : validation → repository → transformation.
// AUCUNE logique métier complexe — juste de l'orchestration et validation.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProfileRow } from "@/types/database";
import type { FullProfile, PublicProfile } from "@/types/api";
import { ProfileRepository } from "@/lib/database/profile-repository";

// =============================================================================
// Types de résultats
// =============================================================================

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// Helpers : conversion DB → API
// =============================================================================

/**
 * Convertit un ProfileRow (DB) en FullProfile (API privé).
 */
function toFullProfile(row: ProfileRow): FullProfile {
  return {
    id: row.id,
    pseudo: row.pseudo,
    avatarUrl: row.avatar_url,
    elo1v1: row.elo_1v1,
    elo4p: row.elo_4p,
    subscription: row.subscription,
    subscriptionExpiresAt: row.subscription_expires_at,
    gamesPlayed: row.games_played,
    gamesWon: row.games_won,
    totalChallengeCalls: row.total_challenge_calls,
    totalChallengeSuccess: row.total_challenge_success,
    bestWinStreak: row.best_win_streak,
    currentWinStreak: row.current_win_streak,
    isOnline: row.is_online,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
  };
}

/**
 * Convertit un ProfileRow (DB) en PublicProfile (API public).
 */
function toPublicProfile(row: ProfileRow): PublicProfile {
  return {
    id: row.id,
    pseudo: row.pseudo,
    avatarUrl: row.avatar_url,
    elo1v1: row.elo_1v1,
    elo4p: row.elo_4p,
    subscription: row.subscription,
    gamesPlayed: row.games_played,
    gamesWon: row.games_won,
    bestWinStreak: row.best_win_streak,
    isOnline: row.is_online,
  };
}

// =============================================================================
// Validation
// =============================================================================

const PSEUDO_MIN_LENGTH = 3;
const PSEUDO_MAX_LENGTH = 20;
const PSEUDO_REGEX = /^[a-zA-Z0-9_àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ-]+$/;

function validatePseudo(pseudo: string): string | null {
  if (pseudo.length < PSEUDO_MIN_LENGTH) {
    return `Le pseudo doit contenir au moins ${PSEUDO_MIN_LENGTH} caractères.`;
  }
  if (pseudo.length > PSEUDO_MAX_LENGTH) {
    return `Le pseudo ne doit pas dépasser ${PSEUDO_MAX_LENGTH} caractères.`;
  }
  if (!PSEUDO_REGEX.test(pseudo)) {
    return "Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores.";
  }
  return null;
}

// =============================================================================
// Profile Service
// =============================================================================

export class ProfileService {
  private readonly repository: ProfileRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new ProfileRepository(supabase);
  }

  // ===========================================================================
  // Récupérer son propre profil (complet)
  // ===========================================================================

  async getMyProfile(userId: string): Promise<ServiceResult<FullProfile>> {
    try {
      const row = await this.repository.findById(userId);
      if (!row) {
        return { success: false, error: "Profil non trouvé." };
      }

      return { success: true, data: toFullProfile(row) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue.",
      };
    }
  }

  // ===========================================================================
  // Récupérer un profil public
  // ===========================================================================

  async getPublicProfile(userId: string): Promise<ServiceResult<PublicProfile>> {
    try {
      const row = await this.repository.findById(userId);
      if (!row) {
        return { success: false, error: "Profil non trouvé." };
      }

      return { success: true, data: toPublicProfile(row) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue.",
      };
    }
  }

  // ===========================================================================
  // Mettre à jour le pseudo
  // ===========================================================================

  async updatePseudo(
    userId: string,
    newPseudo: string,
  ): Promise<ServiceResult<FullProfile>> {
    try {
      // Validation du format
      const validationError = validatePseudo(newPseudo);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Vérifier l'unicité
      const taken = await this.repository.isPseudoTaken(newPseudo, userId);
      if (taken) {
        return { success: false, error: "Ce pseudo est déjà pris." };
      }

      const updated = await this.repository.update(userId, { pseudo: newPseudo });
      if (!updated) {
        return { success: false, error: "Impossible de mettre à jour le profil." };
      }

      return { success: true, data: toFullProfile(updated) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue.",
      };
    }
  }

  // ===========================================================================
  // Mettre à jour l'avatar
  // ===========================================================================

  async updateAvatar(
    userId: string,
    avatarUrl: string,
  ): Promise<ServiceResult<FullProfile>> {
    try {
      // Validation basique de l'URL
      try {
        new URL(avatarUrl);
      } catch {
        return { success: false, error: "URL d'avatar invalide." };
      }

      const updated = await this.repository.update(userId, { avatar_url: avatarUrl });
      if (!updated) {
        return { success: false, error: "Impossible de mettre à jour l'avatar." };
      }

      return { success: true, data: toFullProfile(updated) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue.",
      };
    }
  }

  // ===========================================================================
  // Mettre à jour le profil (pseudo + avatar)
  // ===========================================================================

  async updateProfile(
    userId: string,
    data: { pseudo?: string; avatarUrl?: string },
  ): Promise<ServiceResult<FullProfile>> {
    try {
      const updateData: Partial<Pick<ProfileRow, "pseudo" | "avatar_url">> = {};

      // Valider et préparer le pseudo
      if (data.pseudo) {
        const validationError = validatePseudo(data.pseudo);
        if (validationError) {
          return { success: false, error: validationError };
        }

        const taken = await this.repository.isPseudoTaken(data.pseudo, userId);
        if (taken) {
          return { success: false, error: "Ce pseudo est déjà pris." };
        }

        updateData.pseudo = data.pseudo;
      }

      // Valider l'avatar
      if (data.avatarUrl) {
        try {
          new URL(data.avatarUrl);
        } catch {
          return { success: false, error: "URL d'avatar invalide." };
        }
        updateData.avatar_url = data.avatarUrl;
      }

      if (Object.keys(updateData).length === 0) {
        return { success: false, error: "Aucune donnée à mettre à jour." };
      }

      const updated = await this.repository.update(userId, updateData);
      if (!updated) {
        return { success: false, error: "Impossible de mettre à jour le profil." };
      }

      return { success: true, data: toFullProfile(updated) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue.",
      };
    }
  }

  // ===========================================================================
  // Statut en ligne
  // ===========================================================================

  async setOnlineStatus(userId: string, isOnline: boolean): Promise<ServiceResult<void>> {
    try {
      await this.repository.setOnlineStatus(userId, isOnline);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue.",
      };
    }
  }

  // ===========================================================================
  // Classement
  // ===========================================================================

  async getLeaderboard(limit: number = 50): Promise<ServiceResult<PublicProfile[]>> {
    try {
      const rows = await this.repository.getLeaderboard(limit);
      return {
        success: true,
        data: rows.map(toPublicProfile),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue.",
      };
    }
  }

  // ===========================================================================
  // Recherche
  // ===========================================================================

  async searchProfiles(
    query: string,
    limit: number = 10,
  ): Promise<ServiceResult<PublicProfile[]>> {
    try {
      if (query.length < 2) {
        return { success: false, error: "La recherche doit contenir au moins 2 caractères." };
      }

      const rows = await this.repository.searchByPseudo(query, limit);
      return {
        success: true,
        data: rows.map(toPublicProfile),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue.",
      };
    }
  }
}
