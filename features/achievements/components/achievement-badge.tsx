// =============================================================================
// FEATURE — Achievement Badge (petit icône pour profil / in-game)
// =============================================================================

"use client";

import type { UserAchievement } from "@/types/api";
import {
  Swords,
  Theater,
  Crown,
  ShieldCheck,
  Medal,
  Gem,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  swords: Swords,
  theater: Theater,
  crown: Crown,
  "shield-check": ShieldCheck,
  medal: Medal,
  gem: Gem,
};

interface AchievementBadgeProps {
  achievement: UserAchievement;
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const Icon = ICON_MAP[achievement.icon] ?? Medal;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex size-7 items-center justify-center rounded-md bg-yellow-500/15 text-yellow-500">
            <Icon className="size-3.5" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{achievement.name}</p>
          <p className="text-xs text-muted-foreground">{achievement.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
