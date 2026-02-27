// =============================================================================
// FEATURE — Inviter des amis dans une partie
// =============================================================================

"use client";

import { useState } from "react";
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
import { messagesClient } from "@/features/messages/api/messages-client";
import { toast } from "sonner";
import type { FriendInfo } from "@/types/api";

interface InviteFriendsProps {
  gameCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteFriends({ gameCode, open, onOpenChange }: InviteFriendsProps) {
  const { friends } = useFriends();
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);

  const acceptedFriends = friends.filter((f) => f.status === "accepted");

  const handleInvite = async (friend: FriendInfo) => {
    setSending(friend.id);
    const message = `Rejoins ma partie ! Code : ${gameCode}`;
    const result = await messagesClient.sendMessage({
      receiverId: friend.id,
      content: message,
    });

    if (result.success) {
      setInvitedFriends((prev) => new Set(prev).add(friend.id));
      toast.success(`Invitation envoyée à ${friend.pseudo} !`);
    } else {
      toast.error(result.error ?? "Impossible d'envoyer l'invitation.");
    }
    setSending(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Inviter des amis
          </DialogTitle>
          <DialogDescription>
            Envoyez le code de la partie à vos amis via message privé
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          {acceptedFriends.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Vous n'avez pas d'amis pour le moment.
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
                            {friend.isOnline ? "En ligne" : "Hors ligne"}
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
                        "Envoi..."
                      ) : isInvited ? (
                        <>
                          <Check className="size-4 mr-1" />
                          Invité
                        </>
                      ) : (
                        <>
                          <Send className="size-4 mr-1" />
                          Inviter
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
