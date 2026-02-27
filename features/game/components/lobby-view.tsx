"use client";

import { useState } from "react";
import { Copy, Loader2, Play, Users, Trophy, Swords, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InviteFriends } from "@/features/friends/components/invite-friends";
import type { PublicGameState } from "@/types/api";

interface LobbyViewProps {
  gameState: PublicGameState;
  playerId: string;
  onStartGame: () => Promise<void>;
}

export function LobbyView({ gameState, playerId, onStartGame }: LobbyViewProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const me = gameState.players.find((p) => p.id === playerId);
  const isHost = me?.isHost ?? false;
  const playerCount = gameState.players.length;
  const canStart = isHost && playerCount >= 2;

  function copyCode() {
    navigator.clipboard.writeText(gameState.joinCode);
    toast.success("Code copié !");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 p-4">
      {/* ── Badge du mode ── */}
      {gameState.gameMode === "RANKED" ? (
        <Badge className="gap-1 bg-yellow-500/10 text-yellow-600">
          <Trophy className="size-3" />
          Partie classée
        </Badge>
      ) : gameState.gameMode === "NORMAL" ? (
        <Badge variant="secondary" className="gap-1">
          <Swords className="size-3" />
          Partie normale
        </Badge>
      ) : null}

      {/* ── Code de la partie ── */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">Code de la partie</p>
        <button
          onClick={copyCode}
          className="group flex items-center gap-2 rounded-xl bg-muted px-6 py-3 transition-colors hover:bg-muted/80"
        >
          <span className="font-mono text-3xl font-bold tracking-[0.3em]">
            {gameState.joinCode}
          </span>
          <Copy className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
        <p className="text-xs text-muted-foreground">
          Partagez ce code avec vos amis
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 gap-2"
          onClick={() => setShowInviteDialog(true)}
        >
          <UserPlus className="size-4" />
          Inviter des amis
        </Button>
      </div>

      {/* ── Liste des joueurs ── */}
      <div className="w-full rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Joueurs ({playerCount}/6)
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <Avatar size="sm">
                <AvatarImage src={player.avatarUrl} alt={player.displayName} />
                <AvatarFallback>
                  {player.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 text-sm font-medium">
                {player.displayName}
              </span>
              {player.isHost && (
                <Badge variant="secondary" className="text-xs">
                  Hôte
                </Badge>
              )}
              {player.id === playerId && (
                <Badge variant="outline" className="text-xs">
                  Vous
                </Badge>
              )}
            </div>
          ))}

          {/* Slots vides */}
          {Array.from({ length: 6 - playerCount }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2 text-muted-foreground"
            >
              <div className="size-6 rounded-full bg-muted" />
              <span className="text-sm">En attente...</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bouton démarrer ── */}
      {isHost ? (
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={onStartGame}
          disabled={!canStart}
        >
          <Play className="size-4" />
          {canStart
            ? "Lancer la partie"
            : `En attente de joueurs (min. 2)`}
        </Button>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          En attente du lancement par l&apos;hôte...
        </div>
      )}

      <InviteFriends
        gameCode={gameState.joinCode}
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
      />
    </div>
  );
}
