// =============================================================================
// FEATURE — Tutorial overlay (spotlight + tooltip)
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TutorialStep } from "../types";

interface TutorialOverlayProps {
  step: TutorialStep | null;
  onAdvance: () => void;
  onSkip: () => void;
  stepIndex: number;
  totalSteps: number;
  error: string | null;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TutorialOverlay({
  step,
  onAdvance,
  onSkip,
  stepIndex,
  totalSteps,
  error,
}: TutorialOverlayProps) {
  const t = useTranslations("tutorial.steps");
  const tc = useTranslations("tutorial");
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  // ── Locate and track the highlighted element ──
  const highlightTarget = step?.highlightTarget ?? null;

  useEffect(() => {
    const measure = () => {
      if (!highlightTarget) {
        setTargetRect(null);
        return;
      }
      const el = document.querySelector(
        `[data-tutorial-id="${highlightTarget}"]`,
      );
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setTargetRect(null);
      }
    };

    // Initial measure (slight delay to let DOM render)
    const raf = requestAnimationFrame(measure);

    // Re-measure on resize/scroll
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    // ResizeObserver on the target
    let observer: ResizeObserver | null = null;
    if (highlightTarget) {
      const el = document.querySelector(
        `[data-tutorial-id="${highlightTarget}"]`,
      );
      if (el) {
        observer = new ResizeObserver(measure);
        observer.observe(el);
      }
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      observer?.disconnect();
    };
  }, [highlightTarget]);

  if (!step) return null;

  const showContinueButton =
    step.advanceCondition.type === "click-continue" ||
    step.advanceCondition.type === "free-play";
  const isFullScreen = step.isFullScreen || !step.highlightTarget;
  // For action steps (place-bid, call-challenge), let clicks pass through the backdrop
  const isActionStep =
    step.advanceCondition.type === "place-bid" ||
    step.advanceCondition.type === "call-challenge";

  // Error hint from wrong action
  const hintError =
    error?.startsWith("hint:") ? t(`${error.replace("hint:", "")}Hint`) : null;

  // ── Full-screen info overlay ──
  if (isFullScreen) {
    return (
      <AnimatePresence>
        <motion.div
          key={step.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-4 max-w-md rounded-2xl border bg-card p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {stepIndex + 1} / {totalSteps}
              </span>
              <button
                onClick={onSkip}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-base leading-relaxed">
              {t(step.messageKey)}
            </p>

            {showContinueButton && (
              <Button
                className="mt-6 w-full gap-2"
                onClick={onAdvance}
              >
                {tc("continue")}
                <ChevronRight className="size-4" />
              </Button>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Spotlight overlay with tooltip ──
  const padding = 8;
  const spotlightStyle = targetRect
    ? {
        top: targetRect.top - padding,
        left: targetRect.left - padding,
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2,
      }
    : null;

  // Tooltip position calculation
  const tooltipStyle = getTooltipPosition(
    targetRect,
    step.tooltipPosition,
    padding,
  );

  // Use 4 backdrop panels around the spotlight hole so clicks pass through
  const backdropColor = "rgba(0,0,0,0.6)";
  const s = spotlightStyle;

  return (
    <AnimatePresence>
      <motion.div
        key={step.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none"
      >
        {/* Dark backdrop — 4 panels around the spotlight cutout */}
        {s ? (
          <>
            {/* Top panel */}
            <div
              className={`fixed left-0 top-0 w-full ${isActionStep ? "pointer-events-none" : "pointer-events-auto"}`}
              style={{ height: Math.max(0, s.top), background: backdropColor }}
            />
            {/* Bottom panel */}
            <div
              className={`fixed left-0 bottom-0 w-full ${isActionStep ? "pointer-events-none" : "pointer-events-auto"}`}
              style={{ height: Math.max(0, window.innerHeight - s.top - s.height), background: backdropColor }}
            />
            {/* Left panel */}
            <div
              className={`fixed left-0 ${isActionStep ? "pointer-events-none" : "pointer-events-auto"}`}
              style={{ top: s.top, width: Math.max(0, s.left), height: s.height, background: backdropColor }}
            />
            {/* Right panel */}
            <div
              className={`fixed right-0 ${isActionStep ? "pointer-events-none" : "pointer-events-auto"}`}
              style={{ top: s.top, width: Math.max(0, window.innerWidth - s.left - s.width), height: s.height, background: backdropColor }}
            />
          </>
        ) : (
          <div
            className="fixed inset-0 pointer-events-none"
            style={{ background: backdropColor }}
          />
        )}

        {/* Spotlight border glow */}
        {s && (
          <div
            className="absolute rounded-xl border-2 border-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.3)] pointer-events-none"
            style={s}
          />
        )}

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, y: isActionStep ? -10 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={
            isActionStep
              ? "fixed top-16 left-1/2 -translate-x-1/2 z-10 pointer-events-auto"
              : tooltipStyle
                ? "absolute pointer-events-auto"
                : "fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto"
          }
          style={isActionStep ? undefined : (tooltipStyle ?? undefined)}
        >
          <div className="rounded-xl border bg-card p-4 shadow-2xl" style={{ maxWidth: TOOLTIP_WIDTH, minWidth: 280 }}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {stepIndex + 1} / {totalSteps}
              </span>
              <button
                onClick={onSkip}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-sm leading-relaxed">{t(step.messageKey)}</p>

            {hintError && (
              <p className="mt-2 text-xs text-amber-500">{hintError}</p>
            )}

            {showContinueButton && (
              <Button
                size="sm"
                className="mt-3 w-full gap-1"
                onClick={onAdvance}
              >
                {tc("continue")}
                <ChevronRight className="size-3" />
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Tooltip position helper (viewport-clamped) ──

const TOOLTIP_WIDTH = 350;
const TOOLTIP_HEIGHT_ESTIMATE = 160;
const MARGIN = 16;

function getTooltipPosition(
  targetRect: TargetRect | null,
  position: string,
  padding: number,
): React.CSSProperties | null {
  if (!targetRect) return null;

  const gap = 12;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;

  // Center X relative to the target, then clamp
  const centerX = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2;
  const clampedX = Math.max(MARGIN, Math.min(centerX, vw - TOOLTIP_WIDTH - MARGIN));

  // Try preferred position, fall back if it overflows
  const spaceAbove = targetRect.top - padding - gap;
  const spaceBelow = vh - (targetRect.top + targetRect.height + padding + gap);

  let preferred = position;
  if (preferred === "top" && spaceAbove < TOOLTIP_HEIGHT_ESTIMATE && spaceBelow > spaceAbove) {
    preferred = "bottom";
  } else if (preferred === "bottom" && spaceBelow < TOOLTIP_HEIGHT_ESTIMATE && spaceAbove > spaceBelow) {
    preferred = "top";
  }

  switch (preferred) {
    case "top":
      return {
        bottom: vh - targetRect.top + padding + gap,
        left: clampedX,
        maxWidth: TOOLTIP_WIDTH,
      };
    case "bottom":
      return {
        top: targetRect.top + targetRect.height + padding + gap,
        left: clampedX,
        maxWidth: TOOLTIP_WIDTH,
      };
    case "left":
      return {
        top: Math.max(MARGIN, targetRect.top + targetRect.height / 2 - 50),
        right: vw - targetRect.left + padding + gap,
        maxWidth: TOOLTIP_WIDTH,
      };
    case "right":
      return {
        top: Math.max(MARGIN, targetRect.top + targetRect.height / 2 - 50),
        left: Math.min(targetRect.left + targetRect.width + padding + gap, vw - TOOLTIP_WIDTH - MARGIN),
        maxWidth: TOOLTIP_WIDTH,
      };
    default:
      return {
        top: targetRect.top + targetRect.height + padding + gap,
        left: clampedX,
        maxWidth: TOOLTIP_WIDTH,
      };
  }
}
