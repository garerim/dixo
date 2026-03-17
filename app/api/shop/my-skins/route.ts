// =============================================================================
// API — GET /api/shop/my-skins — Get the list of skin IDs owned by the user
// =============================================================================

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { UserSkinRepository } from "@/lib/database/user-skin-repository";
import { errorResponse, successResponse } from "@/app/api/billing/helpers";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return errorResponse("Not authenticated.", 401);
  }

  try {
    const repo = new UserSkinRepository(supabase);
    const rows = await repo.findByUserId(user.id);
    const skinIds = rows.map((r) => r.skin_id);
    return successResponse({ skinIds });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Error fetching skins.",
      500,
    );
  }
}
