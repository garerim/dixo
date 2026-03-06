// =============================================================================
// FEATURE — Hook useFriends
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { FriendInfo } from "@/types/api";
import { friendsClient } from "../api/friends-client";

interface UseFriendsReturn {
  friends: FriendInfo[];
  isLoading: boolean;
  error: string | null;
  actions: {
    refresh: () => Promise<void>;
    addFriend: (friendId: string) => Promise<boolean>;
    respondToRequest: (friendshipId: string, accept: boolean) => Promise<boolean>;
    removeFriend: (friendshipId: string) => Promise<boolean>;
  };
}

export function useFriends(): UseFriendsReturn {
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await friendsClient.getFriends();
    if (result.success && result.data) {
      setFriends(result.data);
    } else {
      setError(result.error ?? "Unable to load friends.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addFriend = useCallback(async (friendId: string): Promise<boolean> => {
    const result = await friendsClient.addFriend({ friendId });
    if (result.success) {
      toast.success("Demande d'amitié envoyée !");
      await refresh();
      return true;
    } else {
      toast.error(result.error ?? "Impossible d'ajouter l'ami.");
      return false;
    }
  }, [refresh]);

  const respondToRequest = useCallback(
    async (friendshipId: string, accept: boolean): Promise<boolean> => {
      const result = await friendsClient.respondToRequest({ friendshipId, accept });
      if (result.success) {
        toast.success(accept ? "Demande acceptée !" : "Demande refusée.");
        await refresh();
        return true;
      } else {
        toast.error(result.error ?? "Impossible de répondre à la demande.");
        return false;
      }
    },
    [refresh],
  );

  const removeFriend = useCallback(
    async (friendshipId: string): Promise<boolean> => {
      const result = await friendsClient.removeFriend({ friendshipId });
      if (result.success) {
        toast.success("Ami supprimé.");
        await refresh();
        return true;
      } else {
        toast.error(result.error ?? "Impossible de supprimer l'ami.");
        return false;
      }
    },
    [refresh],
  );

  return {
    friends,
    isLoading,
    error,
    actions: {
      refresh,
      addFriend,
      respondToRequest,
      removeFriend,
    },
  };
}
