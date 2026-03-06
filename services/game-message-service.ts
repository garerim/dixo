// =============================================================================
// SERVICE — Game Message Service
// =============================================================================
// Gère les messages de chat dans les parties.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { GameMessage } from "@/types/api";
import { GameMessageRepository } from "@/lib/database/game-message-repository";
import { ProfileRepository } from "@/lib/database/profile-repository";
import { GameRepository } from "@/lib/database/game-repository";

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class GameMessageService {
  private readonly messages: GameMessageRepository;
  private readonly profiles: ProfileRepository;
  private readonly games: GameRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.messages = new GameMessageRepository(supabase);
    this.profiles = new ProfileRepository(supabase);
    this.games = new GameRepository(supabase);
  }

  /**
   * Envoie un message dans une partie.
   */
  async sendMessage(
    gameId: string,
    userId: string,
    content: string,
  ): Promise<ServiceResult<GameMessage>> {
    try {
      // Vérifier que l'utilisateur fait partie de la partie
      const gameState = await this.games.findById(gameId);
      if (!gameState) {
        return { success: false, error: "Game not found." };
      }

      const isPlayer = gameState.players.some((p) => p.id === userId);
      if (!isPlayer) {
        return { success: false, error: "You are not part of this game." };
      }

      // Check that content is not empty
      if (!content.trim()) {
        return { success: false, error: "Message cannot be empty." };
      }

      // Check message length
      if (content.length > 500) {
        return { success: false, error: "Message cannot exceed 500 characters." };
      }

      // Envoyer le message
      const message = await this.messages.send(gameId, userId, content);

      // Get profile to enrich message
      const profile = await this.profiles.findById(userId);
      if (!profile) {
        return { success: false, error: "User profile not found." };
      }

      const result: GameMessage = {
        id: message.id,
        gameId: message.game_id,
        userId: message.user_id,
        userPseudo: profile.pseudo,
        userAvatarUrl: profile.avatar_url,
        content: message.content,
        createdAt: message.created_at,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  /**
   * Récupère les messages d'une partie.
   */
  async getMessages(
    gameId: string,
    userId: string,
    limit: number = 50,
    before?: string,
  ): Promise<ServiceResult<GameMessage[]>> {
    try {
      // Vérifier que l'utilisateur fait partie de la partie
      const gameState = await this.games.findById(gameId);
      if (!gameState) {
        return { success: false, error: "Partie non trouvée." };
      }

      const isPlayer = gameState.players.some((p) => p.id === userId);
      if (!isPlayer) {
        return { success: false, error: "Vous ne faites pas partie de cette partie." };
      }

      // Récupérer les messages
      const messages = await this.messages.getByGameId(gameId, limit, before);

      // Enrichir avec les profils
      const userIds = new Set(messages.map((m) => m.user_id));
      const profilesMap = new Map<string, { pseudo: string; avatarUrl: string | null }>();

      for (const userId of userIds) {
        const profile = await this.profiles.findById(userId);
        if (profile) {
          profilesMap.set(userId, {
            pseudo: profile.pseudo,
            avatarUrl: profile.avatar_url,
          });
        }
      }

      const result: GameMessage[] = messages.map((msg) => {
        const profile = profilesMap.get(msg.user_id);
        return {
          id: msg.id,
          gameId: msg.game_id,
          userId: msg.user_id,
          userPseudo: profile?.pseudo ?? "Unknown",
          userAvatarUrl: profile?.avatarUrl ?? null,
          content: msg.content,
          createdAt: msg.created_at,
        };
      });

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  /**
   * Récupère les nouveaux messages depuis un timestamp.
   */
  async getNewMessages(
    gameId: string,
    userId: string,
    since: string,
  ): Promise<ServiceResult<GameMessage[]>> {
    try {
      // Vérifier que l'utilisateur fait partie de la partie
      const gameState = await this.games.findById(gameId);
      if (!gameState) {
        return { success: false, error: "Partie non trouvée." };
      }

      const isPlayer = gameState.players.some((p) => p.id === userId);
      if (!isPlayer) {
        return { success: false, error: "Vous ne faites pas partie de cette partie." };
      }

      // Récupérer les nouveaux messages
      const messages = await this.messages.getNewMessages(gameId, since);

      // Enrichir avec les profils
      const userIds = new Set(messages.map((m) => m.user_id));
      const profilesMap = new Map<string, { pseudo: string; avatarUrl: string | null }>();

      for (const userId of userIds) {
        const profile = await this.profiles.findById(userId);
        if (profile) {
          profilesMap.set(userId, {
            pseudo: profile.pseudo,
            avatarUrl: profile.avatar_url,
          });
        }
      }

      const result: GameMessage[] = messages.map((msg) => {
        const profile = profilesMap.get(msg.user_id);
        return {
          id: msg.id,
          gameId: msg.game_id,
          userId: msg.user_id,
          userPseudo: profile?.pseudo ?? "Unknown",
          userAvatarUrl: profile?.avatarUrl ?? null,
          content: msg.content,
          createdAt: msg.created_at,
        };
      });

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }
}
