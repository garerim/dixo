"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { DiceFace } from "./dice-face";

interface DiceRollAnimationProps {
  /** Final dice values to reveal */
  finalValues: number[];
  /** Dice skin */
  skin?: string;
  /** Duration of the roll animation in ms */
  duration?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  className?: string;
}

/**
 * Animated dice roll: dice tumble with random faces, then settle on final values.
 */
export function DiceRollAnimation({
  finalValues,
  skin,
  duration = 1200,
  onComplete,
  className,
}: DiceRollAnimationProps) {
  const [phase, setPhase] = useState<"rolling" | "settling" | "done">("rolling");
  const [displayValues, setDisplayValues] = useState<number[]>(
    finalValues.map(() => Math.ceil(Math.random() * 6)),
  );

  // Rapid random cycling during "rolling" phase
  useEffect(() => {
    if (phase !== "rolling") return;

    const interval = setInterval(() => {
      setDisplayValues((prev) =>
        prev.map(() => Math.ceil(Math.random() * 6)),
      );
    }, 80);

    const settleTimer = setTimeout(() => {
      clearInterval(interval);
      setPhase("settling");
    }, duration * 0.7);

    return () => {
      clearInterval(interval);
      clearTimeout(settleTimer);
    };
  }, [phase, duration, finalValues.length]);

  // "Settling" phase: reveal final values one by one
  useEffect(() => {
    if (phase !== "settling") return;

    let revealed = 0;
    const perDice = (duration * 0.3) / finalValues.length;

    const interval = setInterval(() => {
      revealed++;
      setDisplayValues((prev) =>
        prev.map((v, i) =>
          i < revealed ? finalValues[i] : Math.ceil(Math.random() * 6),
        ),
      );

      if (revealed >= finalValues.length) {
        clearInterval(interval);
        setPhase("done");
        onComplete?.();
      }
    }, perDice);

    return () => clearInterval(interval);
  }, [phase, duration, finalValues, onComplete]);

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      {displayValues.map((value, i) => (
        <div
          key={i}
          className={cn(
            "transition-transform",
            phase === "rolling" && "animate-dice-tumble",
            phase === "settling" && i < finalValues.indexOf(value) + 1
              ? "animate-dice-land"
              : "",
          )}
        >
          <DiceFace
            value={value}
            size="lg"
            skin={skin}
            className={cn(
              phase === "done" && "ring-2 ring-primary/30 ring-offset-1 ring-offset-background",
            )}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Hook to manage dice roll animation state.
 * Triggers animation when the round number changes.
 */
export function useDiceRollAnimation(round: number) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevRound, setPrevRound] = useState(round);

  // When round changes, trigger animation
  if (round !== prevRound) {
    setPrevRound(round);
    setIsAnimating(true);
  }

  const handleComplete = useCallback(() => {
    setIsAnimating(false);
  }, []);

  return { isAnimating, handleComplete };
}
