"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dice5 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "./auth-provider";
import { gameClient } from "@/features/game/api/game-client";
import {
  subscribeToInvites,
  type GameInvitePayload,
} from "@/lib/realtime/invite-channel";

export function InviteProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user) {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      return;
    }

    const displayName =
      profile?.pseudo ?? user.user_metadata?.full_name ?? "Player";

    unsubscribeRef.current = subscribeToInvites(user.id, (invite) => {
      showInviteToast(invite, displayName, router);
    });

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [user, profile, router]);

  return <>{children}</>;
}

function showInviteToast(
  invite: GameInvitePayload,
  displayName: string,
  router: ReturnType<typeof useRouter>,
) {
  toast.custom(
    (toastId) => (
      <div className="flex w-full items-center gap-3 rounded-lg border bg-card p-4 shadow-lg">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={invite.senderAvatarUrl ?? undefined} />
          <AvatarFallback>
            {invite.senderPseudo.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-sm font-medium">
            <span className="font-semibold">{invite.senderPseudo}</span>{" "}
            invites you to a game
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Dice5 className="size-3" />
            <span>Code: {invite.joinCode}</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-3 text-xs"
            onClick={() => toast.dismiss(toastId)}
          >
            Decline
          </Button>
          <Button
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={async () => {
              toast.dismiss(toastId);
              const result = await gameClient.joinGame({
                joinCode: invite.joinCode,
                displayName,
              });
              if (result.success && result.data) {
                router.push(`/game/${result.data.gameId}`);
              } else {
                toast.error(result.error ?? "Unable to join the game.");
              }
            }}
          >
            Accept
          </Button>
        </div>
      </div>
    ),
    { duration: 30000 },
  );
}
