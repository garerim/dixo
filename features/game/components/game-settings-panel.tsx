"use client";

import { useState } from "react";
import { Settings, Dice5, Timer, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { GameConfig } from "@/core/game-engine";
import type { UpdateSettingsRequest } from "@/types/api";

// =============================================================================
// Types
// =============================================================================

interface GameSettingsPanelProps {
  config: GameConfig;
  isHost: boolean;
  currentPlayerCount: number;
  onUpdateSettings: (settings: Omit<UpdateSettingsRequest, "gameId">) => Promise<void>;
}

// =============================================================================
// Component
// =============================================================================

export function GameSettingsPanel({
  config,
  isHost,
  currentPlayerCount,
  onUpdateSettings,
}: GameSettingsPanelProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  async function update(settings: Omit<UpdateSettingsRequest, "gameId">) {
    setIsUpdating(true);
    try {
      await onUpdateSettings(settings);
    } finally {
      setIsUpdating(false);
    }
  }

  const diceOptions = [3, 5, 7] as const;
  const timerOptions = [
    { value: null, label: "Off" },
    { value: 15, label: "15s" },
    { value: 30, label: "30s" },
    { value: 60, label: "60s" },
  ] as const;
  const maxPlayerOptions = [2, 3, 4, 5, 6] as const;

  return (
    <div className="w-full rounded-xl border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Settings className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Game settings</span>
        {!isHost && (
          <span className="ml-auto text-xs text-muted-foreground">
            Only the host can edit
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* ── Dice per player ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Dice5 className="size-3.5 text-muted-foreground" />
            <Label className="text-sm">Dice per player</Label>
          </div>
          <div className="flex gap-1">
            {diceOptions.map((count) => (
              <Button
                key={count}
                variant={config.initialDiceCount === count ? "default" : "outline"}
                size="sm"
                className="h-7 w-9 text-xs"
                disabled={!isHost || isUpdating}
                onClick={() => update({ initialDiceCount: count })}
              >
                {count}
              </Button>
            ))}
          </div>
        </div>

        {/* ── Pacos are wild ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-muted-foreground" />
            <Label htmlFor="pacos-switch" className="text-sm">
              Pacos (1s are wild)
            </Label>
          </div>
          <Switch
            id="pacos-switch"
            checked={config.pacosAreWild}
            disabled={!isHost || isUpdating}
            onCheckedChange={(checked) => update({ pacosAreWild: checked })}
          />
        </div>

        {/* ── Turn timer ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Timer className="size-3.5 text-muted-foreground" />
            <Label className="text-sm">Turn timer</Label>
          </div>
          <div className="flex gap-1">
            {timerOptions.map((option) => (
              <Button
                key={String(option.value)}
                variant={config.turnTimer === option.value ? "default" : "outline"}
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={!isHost || isUpdating}
                onClick={() => update({ turnTimer: option.value })}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* ── Max players ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="size-3.5 text-muted-foreground" />
            <Label className="text-sm">Max players</Label>
          </div>
          <div className="flex gap-1">
            {maxPlayerOptions.map((count) => (
              <Button
                key={count}
                variant={config.maxPlayers === count ? "default" : "outline"}
                size="sm"
                className="h-7 w-9 text-xs"
                disabled={!isHost || isUpdating || count < currentPlayerCount}
                onClick={() => update({ maxPlayers: count })}
              >
                {count}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
