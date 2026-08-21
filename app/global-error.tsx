
// =============================================================================
// Global error boundary — capture les erreurs de rendu React (Sentry)
// =============================================================================
// Dernier filet de sécurité : remplace le layout racine en cas d'erreur
// fatale de rendu, la consigne dans Sentry et propose de réessayer.
// =============================================================================

"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 22, margin: 0 }}>Une erreur est survenue</h1>
        <p style={{ color: "#a1a1aa", margin: 0 }}>
          L&apos;incident a été signalé automatiquement à l&apos;équipe.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid #3f3f46",
            background: "#18181b",
            color: "#fafafa",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
