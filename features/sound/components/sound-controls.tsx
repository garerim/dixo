"use client";

import { Volume2, VolumeX, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useSound } from "@/components/providers/sound-provider";

export function SoundControls() {
  const {
    sfxVolume,
    musicVolume,
    isMuted,
    musicEnabled,
    setSfxVolume,
    setMusicVolume,
    toggleMute,
    toggleMusic,
  } = useSound();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          {isMuted ? (
            <VolumeX className="size-4" />
          ) : (
            <Volume2 className="size-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <div className="space-y-4">
          {/* Mute toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Sound</span>
            <Switch checked={!isMuted} onCheckedChange={toggleMute} />
          </div>

          {/* SFX Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Effects</span>
              <span className="text-xs text-muted-foreground">
                {Math.round(sfxVolume * 100)}%
              </span>
            </div>
            <Slider
              value={[sfxVolume * 100]}
              min={0}
              max={100}
              step={5}
              onValueChange={([v]) => setSfxVolume(v / 100)}
              disabled={isMuted}
            />
          </div>

          {/* Music */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Music className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">Music</span>
              </div>
              <Switch checked={musicEnabled} onCheckedChange={toggleMusic} />
            </div>
            {musicEnabled && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Volume</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(musicVolume * 100)}%
                  </span>
                </div>
                <Slider
                  value={[musicVolume * 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([v]) => setMusicVolume(v / 100)}
                  disabled={isMuted}
                />
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
