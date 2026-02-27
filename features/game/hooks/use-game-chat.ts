// =============================================================================
// FEATURE — Hook useGameChat
// =============================================================================
// Gère le chat en temps réel dans une partie avec polling.
// =============================================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { GameMessage } from "@/types/api";
import { gameClient } from "../api/game-client";

interface UseGameChatReturn {
  messages: GameMessage[];
  isLoading: boolean;
  error: string | null;
  actions: {
    sendMessage: (content: string) => Promise<boolean>;
    refresh: () => Promise<void>;
  };
}

const POLL_INTERVAL_MS = 2000; // Polling toutes les 2 secondes

export function useGameChat(gameId: string | null): UseGameChatReturn {
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageTimeRef = useRef<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!gameId) return;

    try {
      const result = await gameClient.getMessages(gameId, 50);
      if (result.success && result.data) {
        setMessages(result.data);
        // Garder le timestamp du dernier message pour le polling
        if (result.data.length > 0) {
          lastMessageTimeRef.current = result.data[result.data.length - 1].createdAt;
        }
      } else {
        setError(result.error ?? "Impossible de charger les messages.");
      }
    } catch (err) {
      setError("Erreur lors du chargement des messages.");
    }
  }, [gameId]);

  const pollNewMessages = useCallback(async () => {
    if (!gameId || !lastMessageTimeRef.current) return;

    try {
      const result = await gameClient.getMessages(gameId, 50);
      if (result.success && result.data) {
        setMessages((prev) => {
          // Créer un Set des IDs existants pour éviter les doublons
          const existingIds = new Set(prev.map((m) => m.id));
          // Filtrer les nouveaux messages (ceux qui ne sont pas déjà dans la liste)
          const newMessages = result.data!.filter((msg) => !existingIds.has(msg.id));
          
          if (newMessages.length > 0) {
            // Mettre à jour le timestamp du dernier message
            const lastMsg = result.data![result.data!.length - 1];
            lastMessageTimeRef.current = lastMsg.createdAt;
            // Ajouter les nouveaux messages à la fin
            return [...prev, ...newMessages];
          }
          
          return prev;
        });
      }
    } catch (err) {
      // Erreur silencieuse pour le polling
    }
  }, [gameId]);

  useEffect(() => {
    if (gameId) {
      setIsLoading(true);
      loadMessages().finally(() => setIsLoading(false));

      // Démarrer le polling pour les nouveaux messages
      pollingRef.current = setInterval(pollNewMessages, POLL_INTERVAL_MS);
    } else {
      setMessages([]);
      lastMessageTimeRef.current = null;
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [gameId, loadMessages, pollNewMessages]);

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!gameId || !content.trim()) return false;

      const result = await gameClient.sendMessage(gameId, { content: content.trim() });
      if (result.success && result.data) {
        setMessages((prev) => [...prev, result.data!]);
        lastMessageTimeRef.current = result.data.createdAt;
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
