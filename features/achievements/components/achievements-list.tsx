// =============================================================================
// FEATURE — Achievements List (Grid)
// =============================================================================

"use client";

import type { UserAchievement } from "@/types/api";
import { AchievementCard } from "./achievement-card";

interface AchievementsListProps {
  achievements: UserAchievement[];
}

export function AchievementsList({ achievements }: AchievementsListProps) {
  if (achievements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No achievements yet.</p>
    );
  }

  // Unlocked first, then by name
  const sorted = [...achievements].sort((a, b) => {
    if (a.isUnlocked && !b.isUnlocked) return -1;
    if (!a.isUnlocked && b.isUnlocked) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sorted.map((achievement) => (
        <AchievementCard key={achievement.achievementId} achievement={achievement} />
      ))}
    </div>
  );
}
