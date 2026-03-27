"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface DiceFaceProps {
  value: number;
  size?: "sm" | "md" | "lg";
  /** Dé caché (affichage de "?") */
  hidden?: boolean;
  /** Dé mis en surbrillance (match avec l'enchère) */
  highlighted?: boolean;
  /** Skin de dé (nom du dossier dans /dices-skins/) */
  skin?: string;
  className?: string;
}

const sizeClasses = {
  sm: "size-8 text-sm rounded-md",
  md: "size-11 text-lg rounded-lg",
  lg: "size-14 text-2xl rounded-xl",
} as const;

const skinSizePx = {
  sm: 32,
  md: 44,
  lg: 56,
} as const;

/**
 * Points d'un dé classique, positionnés en grille 3x3.
 * Chaque point est [row, col] dans une grille 0-2.
 */
const dotPositions: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 2], [2, 0]],
  3: [[0, 2], [1, 1], [2, 0]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

const dotSizeClasses = {
  sm: "size-1.5",
  md: "size-2",
  lg: "size-2.5",
} as const;

export function DiceFace({
  value,
  size = "md",
  hidden = false,
  highlighted = false,
  skin,
  className,
}: DiceFaceProps) {
  const t = useTranslations("game.dice");

  if (hidden) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center border-2 border-border bg-muted font-bold text-muted-foreground select-none",
          sizeClasses[size],
          className,
        )}
      >
        {t("hidden")}
      </div>
    );
  }

  // Skin mode: render image instead of dots
  if (skin) {
    const px = skinSizePx[size];
    return (
      <div
        className={cn(
          "relative inline-flex items-center justify-center select-none overflow-hidden",
          sizeClasses[size],
          highlighted && "ring-2 ring-primary ring-offset-1 ring-offset-background",
          className,
        )}
        title={t("title", { value })}
      >
        <Image
          src={`/dices-skins/${skin}/dice-${value}.png`}
          alt={t("alt", { value })}
          width={px}
          height={px}
          className="size-full object-cover"
          draggable={false}
        />
      </div>
    );
  }

  const dots = dotPositions[value] ?? [];

  return (
    <div
      className={cn(
        "relative inline-grid grid-cols-3 grid-rows-3 items-center justify-items-center border-2 bg-card shadow-sm select-none transition-colors",
        sizeClasses[size],
        highlighted
          ? "border-primary bg-primary/10 shadow-primary/20 shadow-md"
          : "border-border",
        value === 1 && "text-red-500",
        className,
      )}
      title={t("title", { value })}
    >
      {/* Grille 3x3 : 9 cellules, on affiche un point là où il faut */}
      {Array.from({ length: 9 }).map((_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const hasDot = dots.some(([r, c]) => r === row && c === col);

        return (
          <span key={i} className="flex items-center justify-center">
            {hasDot && (
              <span
                className={cn(
                  "rounded-full",
                  dotSizeClasses[size],
                  value === 1
                    ? "bg-red-500"
                    : highlighted
                      ? "bg-primary"
                      : "bg-foreground",
                )}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

/** Affiche une rangée de dés */
export function DiceRow({
  values,
  size = "md",
  highlightFace,
  skin,
  className,
}: {
  values: number[];
  size?: "sm" | "md" | "lg";
  highlightFace?: number;
  skin?: string;
  className?: string;
}) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {values.map((v, i) => (
        <DiceFace
          key={i}
          value={v}
          size={size}
          skin={skin}
          highlighted={
            highlightFace !== undefined &&
            (v === highlightFace || (highlightFace !== 1 && v === 1))
          }
        />
      ))}
    </div>
  );
}

/** Dés cachés (n dés avec "?") */
export function HiddenDice({
  count,
  size = "sm",
  className,
}: {
  count: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <DiceFace key={i} value={1} size={size} hidden />
      ))}
    </div>
  );
}
