// =============================================================================
// INFRASTRUCTURE — Realtime Channel (Supabase Realtime)
// =============================================================================
// Gère les abonnements temps réel pour une partie.
// Utilisé côté client uniquement pour recevoir les mises à jour du GameState.
// =============================================================================

import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PublicGameState } from "@/types/api";

/** Callback appelé quand l'état du jeu change */
export type GameStateChangeCallback = (state: PublicGameState) => void;

/** Callback appelé quand un joueur rejoint/quitte */
export type PresenceChangeCallback = (onlinePlayers: string[]) => void;

/**
 * Crée un canal Realtime pour une partie et s'abonne aux changements.
 *
 * Architecture :
 * - On écoute les changements sur la table `games` filtrés par game_id
 * - Le serveur broadcast aussi des événements custom via le canal
 *
 * @param gameId - ID de la partie
 * @param onStateChange - Callback appelé quand l'état change
 * @param onPresenceChange - Callback optionnel pour la présence
 * @returns Fonction de cleanup pour se désabonner
 */
export function subscribeToGame(
  gameId: string,
  onStateChange: GameStateChangeCallback,
  onPresenceChange?: PresenceChangeCallback,
): () => void {
  const supabase = getSupabaseBrowserClient();

  const channel: RealtimeChannel = supabase
    .channel(`game:${gameId}`)
    // Écouter les changements de la table games
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "games",
        filter: `id=eq.${gameId}`,
      },
      (payload) => {
        // Quand la ligne est mise à jour, on parse le nouvel état
        const newState = payload.new as { state: PublicGameState };
        if (newState.state) {
          onStateChange(newState.state);
        }
      },
    )
    // Écouter les événements custom broadcastés par le serveur
    .on("broadcast", { event: "game_update" }, (payload) => {
      if (payload.payload) {
        onStateChange(payload.payload as PublicGameState);
      }
    });

  // Présence (optionnel)
  if (onPresenceChange) {
    channel.on("presence", { event: "sync" }, () => {
      const presenceState = channel.presenceState();
      const onlinePlayers = Object.keys(presenceState);
      onPresenceChange(onlinePlayers);
    });
  }

  // S'abonner au canal
  channel.subscribe();

  // Retourner la fonction de cleanup
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Broadcast un événement custom sur le canal d'une partie.
 * Utilisé côté serveur pour notifier immédiatement les clients.
 */
export async function broadcastGameUpdate(
  gameId: string,
  state: PublicGameState,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const channel = supabase.channel(`game:${gameId}`);

  await channel.send({
    type: "broadcast",
    event: "game_update",
    payload: state,
  });
}
