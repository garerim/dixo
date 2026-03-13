// =============================================================================
// INFRASTRUCTURE — Realtime Channel for game invites
// =============================================================================
// Uses Supabase Realtime broadcast to send ephemeral game invitations.
// No database table needed — invites are delivered as real-time toasts.
// =============================================================================

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Payload sent with a game invite broadcast */
export interface GameInvitePayload {
  /** ID of the sender */
  senderId: string;
  /** Display name of the sender */
  senderPseudo: string;
  /** Avatar URL of the sender */
  senderAvatarUrl: string | null;
  /** The game ID to join */
  gameId: string;
  /** The 6-char join code */
  joinCode: string;
}

/** Callback when a game invite is received */
export type GameInviteCallback = (invite: GameInvitePayload) => void;

/**
 * Subscribe to game invites for a specific user.
 * Listens on a per-user broadcast channel.
 *
 * @param userId - The receiving user's ID
 * @param onInvite - Callback when an invite arrives
 * @returns Cleanup function to unsubscribe
 */
export function subscribeToInvites(
  userId: string,
  onInvite: GameInviteCallback,
): () => void {
  const supabase = getSupabaseBrowserClient();

  const channel = supabase
    .channel(`invites:${userId}`)
    .on("broadcast", { event: "game_invite" }, (payload) => {
      if (payload.payload) {
        onInvite(payload.payload as GameInvitePayload);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Send a game invite to a specific user via broadcast.
 *
 * @param receiverId - The target user's ID
 * @param invite - The invite payload
 */
export async function sendGameInvite(
  receiverId: string,
  invite: GameInvitePayload,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const channel = supabase.channel(`invites:${receiverId}`);

  // Need to subscribe briefly to send on the channel
  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") resolve();
    });
  });

  await channel.send({
    type: "broadcast",
    event: "game_invite",
    payload: invite,
  });

  // Cleanup: remove the temporary channel
  supabase.removeChannel(channel);
}
