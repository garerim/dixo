// =============================================================================
// Instrumentation Next.js — initialisation de la collecte d'erreurs (Sentry)
// =============================================================================
// Chargé automatiquement par Next.js au démarrage du serveur.
// La collecte n'est active que si NEXT_PUBLIC_SENTRY_DSN est défini :
// sans DSN (ex. développement local), tout est inactif sans erreur.
// =============================================================================

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? "development",
    // Erreurs uniquement (pas de tracing) : quota gratuit préservé.
    tracesSampleRate: 0,
  });
}

// Capture les erreurs non gérées des Route Handlers et Server Components.
export const onRequestError = Sentry.captureRequestError;
