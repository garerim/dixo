// =============================================================================
// FEATURE — Hook useProfile
// =============================================================================
// Hook pour gérer le profil utilisateur côté client.
// Gère : chargement, mise à jour pseudo/avatar, cache local.
// AUCUNE logique métier — tout est délégué au serveur.
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import type { FullProfile } from "@/types/api";
import { profileClient } from "../api/profile-client";

// =============================================================================
// Types
// =============================================================================

interface UseProfileReturn {
  /** Profil complet (null si pas encore chargé) */
  profile: FullProfile | null;
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Actions */
  actions: {
    /** Met à jour le pseudo */
    updatePseudo: (pseudo: string) => Promise<{ success: boolean; error?: string }>;
    /** Met à jour l'avatar */
    updateAvatar: (avatarUrl: string) => Promise<boolean>;
    /** Met à jour pseudo + avatar */
    updateProfile: (data: { pseudo?: string; avatarUrl?: string }) => Promise<boolean>;
    /** Recharger le profil */
    refresh: () => Promise<void>;
  };
}

// =============================================================================
// Hook
// =============================================================================

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===========================================================================
  // Charger le profil
  // ===========================================================================

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await profileClient.getMyProfile();

    if (result.success && result.data) {
      setProfile(result.data);
    } else {
      setError(result.error ?? "Unable to load profile.");
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ===========================================================================
  // Mettre à jour le pseudo
  // ===========================================================================

  const updatePseudo = useCallback(async (pseudo: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    const result = await profileClient.updateProfile({ pseudo });

    if (result.success && result.data) {
      setProfile(result.data);
      return { success: true };
    }

    const errorMessage = result.error ?? "Unable to update pseudo.";
    setError(errorMessage);
    return { success: false, error: errorMessage };
  }, []);

  // ===========================================================================
  // Mettre à jour l'avatar
  // ===========================================================================

  const updateAvatar = useCallback(async (avatarUrl: string): Promise<boolean> => {
    setError(null);
    const result = await profileClient.updateProfile({ avatarUrl });

    if (result.success && result.data) {
      setProfile(result.data);
      return true;
    }

    setError(result.error ?? "Unable to update avatar.");
    return false;
  }, []);

  // ===========================================================================
  // Mettre à jour le profil complet
  // ===========================================================================

  const updateProfile = useCallback(
    async (data: { pseudo?: string; avatarUrl?: string }): Promise<boolean> => {
      setError(null);
      const result = await profileClient.updateProfile(data);

      if (result.success && result.data) {
        setProfile(result.data);
        return true;
      }

      setError(result.error ?? "Unable to update profile.");
      return false;
    },
    [],
  );

  // ===========================================================================
  // Retour
  // ===========================================================================

  return {
    profile,
    isLoading,
    error,
    actions: {
      updatePseudo,
      updateAvatar,
      updateProfile,
      refresh: loadProfile,
    },
  };
}
