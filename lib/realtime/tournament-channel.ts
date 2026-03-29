// =============================================================================
// INFRASTRUCTURE — Realtime Channel pour les tournois (Supabase Realtime)
// =============================================================================
// Gère les abonnements temps réel pour un tournoi.
// Utilisé côté client uniquement pour recevoir les mises à jour du bracket
// et les changements de participants.
// =============================================================================

import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { TournamentRow } from "@/types/database";

/** Callback appelé quand le bracket du tournoi est mis à jour */
export type BracketUpdateCallback = (tournament: TournamentRow) => void;

/** Callback appelé quand un participant rejoint/quitte le tournoi */
export type ParticipantChangeCallback = () => void;

/** Options de callbacks pour l'abonnement tournoi */
export interface TournamentSubscriptionCallbacks {
  onBracketUpdate: BracketUpdateCallback;
  onParticipantChange: ParticipantChangeCallback;
}

/**
 * Crée un canal Realtime pour un tournoi et s'abonne aux changements.
 *
 * Architecture :
 * - On écoute les changements sur la table `tournaments` filtrés par id
 * - On écoute les INSERT/DELETE sur `tournament_participants` filtrés par tournament_id
 *
 * @param tournamentId - ID du tournoi
 * @param callbacks - Callbacks pour les événements
 * @returns Fonction de cleanup pour se désabonner
 */
export function subscribeToTournament(
  tournamentId: string,
  callbacks: TournamentSubscriptionCallbacks,
): () => void {
  const supabase = getSupabaseBrowserClient();

  const channel: RealtimeChannel = supabase
    .channel(`tournament:${tournamentId}`)
    // Écouter les mises à jour du tournoi (bracket, statut, etc.)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "tournaments",
        filter: `id=eq.${tournamentId}`,
      },
      (payload) => {
        const updated = payload.new as TournamentRow;
        if (updated) {
          callbacks.onBracketUpdate(updated);
        }
      },
    )
    // Écouter les nouveaux participants
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "tournament_participants",
        filter: `tournament_id=eq.${tournamentId}`,
      },
      () => {
        callbacks.onParticipantChange();
      },
    )
    // Écouter les départs de participants
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "tournament_participants",
        filter: `tournament_id=eq.${tournamentId}`,
      },
      () => {
        callbacks.onParticipantChange();
      },
    );

  // S'abonner au canal
  channel.subscribe();

  // Retourner la fonction de cleanup
  return () => {
    supabase.removeChannel(channel);
  };
}
