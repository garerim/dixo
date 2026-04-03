// =============================================================================
// ROBOTS — app/robots.ts
// Next.js generates /robots.txt at build time from this file.
// =============================================================================

import type { MetadataRoute } from "next";

const BASE_URL = "https://dixo-game.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // All crawlers: allow public pages, block private/functional routes.
        userAgent: "*",
        allow: [
          "/",
          "/how-to-play",
          "/pricing",
          "/leaderboard",
          "/ranks",
          "/tournaments",
          "/training",
          "/skins",
          "/login",
        ],
        disallow: [
          "/game/",         // auth-gated live game sessions
          "/profile",       // personal account pages
          "/friends",       // auth-gated social feature
          "/shop",          // auth-gated purchase flow
          "/admin/",        // internal admin dashboard
          "/offline",       // PWA fallback page — no indexable content
          "/tutorial/",     // ephemeral tutorial session
          "/training/play", // ephemeral training session
          "/api/",          // all API route handlers
          "/auth/",         // auth callback endpoints
        ],
      },
      // Explicitly allow AI search crawlers
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
      // Block training-only crawlers (no search benefit)
      { userAgent: "CCBot", disallow: "/" },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
