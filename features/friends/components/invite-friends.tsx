// =============================================================================
// FEATURE — Inviter des amis dans une partie
// =============================================================================

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFriends } from "../hooks/use-friends";
import { useAuth } from "@/components/providers/auth-provider";
import { sendGameInvite } from "@/lib/realtime/invite-channel";
import { toast } from "sonner";
import type { FriendInfo } from "@/types/api";

interface InviteFriendsProps {
  gameCode: string;
  gameId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteFriends({ gameCode, gameId, open, onOpenChange }: InviteFriendsProps) {
  const t = useTranslations("invite");
  const tc = useTranslations("common");
  const { user, profile } = useAuth();
  const { friends } = useFriends();
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);

  const acceptedFriends = friends.filter((f) => f.status === "accepted");

  const handleInvite = async (friend: FriendInfo) => {
    if (!user) return;

    setSending(friend.id);
    try {
      // Send real-time broadcast + persistent notification in parallel
      await Promise.all([
        sendGameInvite(friend.id, {
          senderId: user.id,
          senderPseudo: profile?.pseudo ?? user.user_metadata?.full_name ?? "Player",
          senderAvatarUrl: profile?.avatarUrl ?? user.user_metadata?.avatar_url ?? null,
          gameId,
          joinCode: gameCode,
        }),
        fetch("/api/notifications/game-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientId: friend.id, gameId, joinCode: gameCode }),
        }).then((res) => {
          if (!res.ok) console.error("[InviteFriends] Failed to create persistent notification");
        }),
      ]);
      setInvitedFriends((prev) => new Set(prev).add(friend.id));
      toast.success(t("toasts.sent", { name: friend.pseudo }));
    } catch {
      toast.error(t("toasts.error"));
    }
    setSending(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          {acceptedFriends.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {t("noFriends")}
            </p>
          ) : (
            <div className="space-y-2">
              {acceptedFriends.map((friend) => {
                const isInvited = invitedFriends.has(friend.id);
                const isSending = sending === friend.id;

                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={friend.avatarUrl ?? undefined} />
                        <AvatarFallback>
                          {friend.pseudo.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{friend.pseudo}</p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={friend.isOnline ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {friend.isOnline ? tc("online") : tc("offline")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleInvite(friend)}
                      disabled={isInvited || isSending}
                    >
                      {isSending ? (
                        t("sending")
                      ) : isInvited ? (
                        <>
                          <Check className="size-4 mr-1" />
                          {t("invited")}
                        </>
                      ) : (
                        <>
                          <Send className="size-4 mr-1" />
                          {t("inviteButton")}
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
