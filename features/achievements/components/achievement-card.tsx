// =============================================================================
// FEATURE — Achievement Card
// =============================================================================

"use client";

import type { UserAchievement } from "@/types/api";
import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import {
  Swords,
  Theater,
  Crown,
  ShieldCheck,
  Medal,
  Gem,
  Lock,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  swords: Swords,
  theater: Theater,
  crown: Crown,
  "shield-check": ShieldCheck,
  medal: Medal,
  gem: Gem,
};

interface AchievementCardProps {
  achievement: UserAchievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const t = useTranslations("achievements");
  const Icon = ICON_MAP[achievement.icon] ?? Medal;
  const progress =
    achievement.maxValue > 0
      ? (achievement.currentValue / achievement.maxValue) * 100
      : 0;

  return (
    <div
      className={`relative flex flex-col gap-2 rounded-xl border p-3 transition-colors ${
        achievement.isUnlocked
          ? "border-yellow-500/40 bg-yellow-500/5"
          : "border-muted bg-muted/30 opacity-60"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
            achievement.isUnlocked
              ? "bg-yellow-500/15 text-yellow-500"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {achievement.isUnlocked ? (
            <Icon className="size-4.5" />
          ) : (
            <Lock className="size-4" />
          )}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold leading-tight truncate">
            {achievement.name}
          </span>
          <span className="text-xs text-muted-foreground leading-tight">
            {t(`desc_${achievement.achievementId}`)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {!achievement.isUnlocked && achievement.maxValue > 1 && (
        <div className="flex flex-col gap-1">
          <Progress value={progress} className="h-1.5" />
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {achievement.currentValue} / {achievement.maxValue}
          </span>
        </div>
      )}

      {/* Unlocked date */}
      {achievement.isUnlocked && achievement.unlockedAt && (
        <span className="text-[10px] text-yellow-600 dark:text-yellow-400">
          {t("unlocked", {
            date: new Date(achievement.unlockedAt).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          })}
        </span>
      )}
    </div>
  );
}
