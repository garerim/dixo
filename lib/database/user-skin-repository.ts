// =============================================================================
// INFRASTRUCTURE — UserSkin Repository
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserSkinRow } from "@/types/database";

export class UserSkinRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /** Get all skins owned by a user */
  async findByUserId(userId: string): Promise<UserSkinRow[]> {
    const { data, error } = await this.supabase
      .from("user_skins")
      .select("*")
      .eq("user_id", userId);

    if (error || !data) return [];
    return data;
  }

  /** Check if a user owns a specific skin */
  async userOwnsSkin(userId: string, skinId: string): Promise<boolean> {
    const { count } = await this.supabase
      .from("user_skins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("skin_id", skinId);

    return (count ?? 0) > 0;
  }

  /** Grant a skin to a user (idempotent — ignores duplicates) */
  async grantSkin(
    userId: string,
    skinId: string,
    stripeSessionId?: string,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (this.supabase.from("user_skins") as any)
      .upsert(
        {
          user_id: userId,
          skin_id: skinId,
          stripe_session_id: stripeSessionId ?? null,
        },
        { onConflict: "user_id,skin_id" },
      );

    if (error) {
      throw new Error(`Error granting skin: ${error.message}`);
    }
  }

  /** Revoke a skin from a user (idempotent — no-op if not owned) */
  async revokeSkin(userId: string, skinId: string): Promise<void> {
    const { error } = await this.supabase
      .from("user_skins")
      .delete()
      .eq("user_id", userId)
      .eq("skin_id", skinId);

    if (error) {
      throw new Error(`Error revoking skin: ${error.message}`);
    }
  }
}
