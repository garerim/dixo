// =============================================================================
// Instrumentation client — collecte des erreurs navigateur (Sentry)
// =============================================================================
// Chargé automatiquement par Next.js côté navigateur.
// Inactif sans NEXT_PUBLIC_SENTRY_DSN (ex. développement local).
// =============================================================================

import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    tracesSampleRate: 0,
  });
}

// Instrumente les navigations du routeur App Router.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
