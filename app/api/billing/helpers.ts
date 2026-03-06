// =============================================================================
// API — Helpers pour les routes billing
// =============================================================================

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileRepository } from "@/lib/database/profile-repository";
import type { ApiResponse } from "@/types/api";

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: message } satisfies ApiResponse,
    { status },
  );
}

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    { success: true, data } satisfies ApiResponse<T>,
    { status },
  );
}

/**
 * Récupère l'utilisateur authentifié et un ProfileRepository.
 */
export async function withBillingAuth() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, profileRepo: null, supabase: null };
  }

  const profileRepo = new ProfileRepository(supabase);
  return { user, profileRepo, supabase };
}
