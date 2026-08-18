// =============================================================================
// API — GET /api/health
// =============================================================================
// Sonde de supervision (health check) interrogée par le monitoring externe
// (UptimeRobot) pour vérifier la disponibilité de l'application ET de sa
// base de données. Publique, sans authentification, jamais mise en cache.
// =============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import packageJson from "@/package.json";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  // Sonde base de données : requête minimale (1 ligne, colonne id uniquement).
  // Client anonyme dédié : la sonde ne doit dépendre d'aucune session.
  let database: "up" | "down" = "down";
  let dbLatencyMs: number | null = null;
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const t0 = Date.now();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    dbLatencyMs = Date.now() - t0;
    if (!error) database = "up";
  } catch {
    database = "down";
  }

  const healthy = database === "up";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      version: packageJson.version,
      checks: {
        server: "up",
        database,
        dbLatencyMs,
      },
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    {
      // 503 si la base est injoignable -> UptimeRobot déclenche une alerte.
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
