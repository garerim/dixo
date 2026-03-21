// =============================================================================
// FEATURE — Hook useAchievements
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserAchievement } from "@/types/api";
import { achievementsClient } from "../api/achievements-client";
import { useAuth } from "@/components/providers/auth-provider";

interface UseAchievementsReturn {
  achievements: UserAchievement[];
  isLoading: boolean;
  unlockedCount: number;
  totalCount: number;
  refresh: () => Promise<void>;
}

export function useAchievements(): UseAchievementsReturn {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAchievements = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    const result = await achievementsClient.getMyAchievements();

    if (result.success && result.data) {
      setAchievements(result.data);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return {
    achievements,
    isLoading,
    unlockedCount,
    totalCount: achievements.length,
    refresh: loadAchievements,
  };
}
