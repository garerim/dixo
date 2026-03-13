// =============================================================================
// INFRASTRUCTURE — Realtime Channel for rematch requests
// =============================================================================
// Single shared channel per game for rematch communication.
// Both players subscribe to `rematch:${gameId}` and use the SAME channel
// instance to send events — avoids conflicts from duplicate subscriptions.
// =============================================================================

import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Rematch request payload */
export interface RematchRequestPayload {
  requesterId: string;
  requesterName: string;
}

/** Rematch accepted payload — includes the new game info */
export interface RematchAcceptedPayload {
  gameId: string;
  joinCode: string;
}

export type RematchEventCallback = (
  event: "rematch_request" | "rematch_accepted" | "rematch_declined",
  payload: RematchRequestPayload | RematchAcceptedPayload,
) => void;

/** Handle returned by subscribeToRematch — send + cleanup on the same channel */
export interface RematchHandle {
  /** Send a rematch event on the shared channel */
  send: (
    event: "rematch_request" | "rematch_accepted" | "rematch_declined",
    payload: RematchRequestPayload | RematchAcceptedPayload,
  ) => Promise<void>;
  /** Unsubscribe and remove the channel */
  unsubscribe: () => void;
}

/**
 * Subscribe to rematch events and return a handle to send events on the same channel.
 */
export function subscribeToRematch(
  gameId: string,
  onEvent: RematchEventCallback,
): RematchHandle {
  const supabase = getSupabaseBrowserClient();

  const channel: RealtimeChannel = supabase
    .channel(`rematch:${gameId}`)
    .on("broadcast", { event: "rematch_request" }, (payload) => {
      if (payload.payload) {
        onEvent("rematch_request", payload.payload as RematchRequestPayload);
      }
    })
    .on("broadcast", { event: "rematch_accepted" }, (payload) => {
      if (payload.payload) {
        onEvent("rematch_accepted", payload.payload as RematchAcceptedPayload);
      }
    })
    .on("broadcast", { event: "rematch_declined" }, (payload) => {
      if (payload.payload) {
        onEvent("rematch_declined", payload.payload as RematchRequestPayload);
      }
    })
    .subscribe();

  return {
    send: async (event, payload) => {
      await channel.send({
        type: "broadcast",
        event,
        payload,
      });
    },
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}
