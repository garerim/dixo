// =============================================================================
// SITEMAP — app/sitemap.ts
// Next.js generates /sitemap.xml at build time from this file.
// Only statically-reachable, publicly-indexable pages are listed.
// Excluded: /game/[id] (auth-gated), /admin, /offline, /auth/callback,
//           /profile (auth-gated), /friends (auth-gated), /shop (auth-gated),
//           /tutorial/play (ephemeral session), /training/play (ephemeral session)
// =============================================================================

import type { MetadataRoute } from "next";

const BASE_URL = "https://dixo-game.com";

// Static pages that are publicly visible and indexable.
// lastModified reflects the approximate date of last meaningful content change.
// priority and changefreq are intentionally omitted — Google ignores them.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/`,
      lastModified: "2026-04-03",
    },
    {
      url: `${BASE_URL}/how-to-play`,
      lastModified: "2026-04-03",
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: "2026-04-03",
    },
    {
      url: `${BASE_URL}/leaderboard`,
      lastModified: "2026-04-03",
    },
    {
      url: `${BASE_URL}/ranks`,
      lastModified: "2026-04-03",
    },
    {
      url: `${BASE_URL}/tournaments`,
      lastModified: "2026-04-03",
    },
    {
      url: `${BASE_URL}/training`,
      lastModified: "2026-04-03",
    },
    {
      url: `${BASE_URL}/skins`,
      lastModified: "2026-04-03",
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: "2026-04-03",
    },
  ];
}
