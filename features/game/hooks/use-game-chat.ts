// =============================================================================
// FEATURE — Hook useGameChat
// =============================================================================
// Gère le chat en temps réel dans une partie avec Supabase Realtime.
// =============================================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { GameMessage } from "@/types/api";
import { gameClient } from "../api/game-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";

interface UseGameChatReturn {
  messages: GameMessage[];
  isLoading: boolean;
  error: string | null;
  actions: {
    sendMessage: (content: string) => Promise<boolean>;
    refresh: () => Promise<void>;
  };
}

export function useGameChat(gameId: string | null): UseGameChatReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>["channel"]> | null>(null);

  const loadMessages = useCallback(async () => {
    if (!gameId) return;

    try {
      const result = await gameClient.getMessages(gameId, 50);
      if (result.success && result.data) {
        setMessages(result.data);
      } else {
        setError(result.error ?? "Impossible de charger les messages.");
      }
    } catch (err) {
      setError("Erreur lors du chargement des messages.");
    }
  }, [gameId]);

  useEffect(() => {
    if (!gameId || !user) {
      setMessages([]);
      return;
    }

    // Charger les messages initiaux
    setIsLoading(true);
    loadMessages().finally(() => setIsLoading(false));

    // Configurer Realtime pour les nouveaux messages
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`game_messages:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_messages",
          filter: `game_id=eq.${gameId}`,
        },
        async (payload) => {
          // Nouveau message dans la partie
          const newMessage = payload.new as any;
          
          // Récupérer les infos du profil de l'expéditeur
          const { data: profile } = await supabase
            .from("profiles")
            .select("pseudo, avatar_url")
            .eq("id", newMessage.user_id)
            .single();

          if (profile) {
            const message: GameMessage = {
              id: newMessage.id,
              gameId: newMessage.game_id,
              userId: newMessage.user_id,
              userPseudo: profile.pseudo,
              userAvatarUrl: profile.avatar_url,
              content: newMessage.content,
              createdAt: newMessage.created_at,
            };
            setMessages((prev) => {
              // Éviter les doublons
              if (prev.some((m) => m.id === message.id)) return prev;
              return [...prev, message];
            });
          }
        },
      )
      .subscribe();

    channelRef.current = channel as any;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [gameId, user, loadMessages]);

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!gameId || !content.trim()) return false;

      const result = await gameClient.sendMessage(gameId, { content: content.trim() });
      if (result.success) {
        // Le message sera ajouté automatiquement via Realtime
        return true;
      } else {
        toast.error(result.error ?? "Impossible d'envoyer le message.");
        return false;
      }
    },
    [gameId],
  );

  const refresh = useCallback(async () => {
    if (!gameId) return;
    setIsLoading(true);
    await loadMessages();
    setIsLoading(false);
  }, [gameId, loadMessages]);

  return {
    messages,
    isLoading,
    error,
    actions: {
      sendMessage,
      refresh,
    },
  };
}
