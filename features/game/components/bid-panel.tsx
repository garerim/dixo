"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Loader2, Minus, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiceFace } from "./dice-face";
import type { Bid } from "@/core/game-engine";

interface BidPanelProps {
  currentBid: Bid | null;
  totalDice: number;
  onPlaceBid: (quantity: number, faceValue: number) => Promise<void>;
  onCallChallenge: () => Promise<void>;
  canChallenge: boolean;
  disabled?: boolean;
  className?: string;
}

export function BidPanel({
  currentBid,
  totalDice,
  onPlaceBid,
  onCallChallenge,
  canChallenge,
  disabled = false,
  className,
}: BidPanelProps) {
  const t = useTranslations("game.bidPanel");
  const minQuantity = currentBid ? currentBid.quantity : 1;
  const [quantity, setQuantity] = useState(minQuantity);
  const [faceValue, setFaceValue] = useState(currentBid ? currentBid.faceValue : 2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleBid() {
    setIsSubmitting(true);
    await onPlaceBid(quantity, faceValue);
    setIsSubmitting(false);
  }

  async function handleChallenge() {
    setIsSubmitting(true);
    await onCallChallenge();
    setIsSubmitting(false);
  }

  const isDisabled = disabled || isSubmitting;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm",
        className,
      )}
    >
      {/* ── Enchère actuelle ── */}
      {currentBid && (
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
          <span className="text-muted-foreground">{t("currentBid")}</span>
          <span className="font-bold">{currentBid.quantity} &times;</span>
          <DiceFace value={currentBid.faceValue} size="sm" />
        </div>
      )}

      {/* ── Sélection quantité ── */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("quantity")}
        </label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={isDisabled || quantity <= 1}
          >
            <Minus className="size-3" />
          </Button>
          <span className="w-12 text-center text-2xl font-bold tabular-nums">
            {quantity}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setQuantity((q) => Math.min(totalDice, q + 1))}
            disabled={isDisabled || quantity >= totalDice}
          >
            <Plus className="size-3" />
          </Button>
          <span className="text-xs text-muted-foreground">/ {totalDice}</span>
        </div>
      </div>

      {/* ── Sélection face ── */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("diceFace")}
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6].map((face) => (
            <button
              key={face}
              onClick={() => setFaceValue(face)}
              disabled={isDisabled}
              className={cn(
                "transition-transform hover:scale-110 disabled:hover:scale-100",
                faceValue === face && "scale-110",
              )}
            >
              <DiceFace
                value={face}
                size="md"
                highlighted={faceValue === face}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── Boutons d'action ── */}
      <div className="flex gap-2 pt-1">
        <Button
          className="flex-1 gap-2"
          onClick={handleBid}
          disabled={isDisabled}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          {t("placeBid", { quantity })}
          <DiceFace value={faceValue} size="sm" />
        </Button>

        {canChallenge && (
          <Button
            variant="destructive"
            className="gap-2"
            onClick={handleChallenge}
            disabled={isDisabled}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <AlertTriangle className="size-4" />
            )}
            {t("challenge")}
          </Button>
        )}
      </div>
    </div>
  );
}
