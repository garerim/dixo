"use client";

// =============================================================================
// PAGE — /offline — Fallback page when network is unavailable
// =============================================================================

import { useTranslations } from "next-intl";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  const t = useTranslations("offlinePage");
  const tc = useTranslations("common");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <WifiOff className="size-16 text-muted-foreground" />
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="max-w-sm text-muted-foreground">
        {t("description")}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {tc("retry")}
      </button>
    </div>
  );
}
