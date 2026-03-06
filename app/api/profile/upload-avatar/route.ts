// =============================================================================
// API — POST /api/profile/upload-avatar — Upload avatar image
// =============================================================================

import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse("Not authenticated.", 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No file provided.", 400);
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(
        "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
        400,
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse("File size exceeds 5MB limit.", 400);
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = fileName; // Path is relative to the bucket

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return errorResponse(
        uploadError.message ?? "Failed to upload image.",
        500,
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // Delete old avatar if exists
    const { data: profileData } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (profileData?.avatar_url) {
      // Extract file path from public URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/avatars/[path]
      const urlParts = profileData.avatar_url.split("/avatars/");
      if (urlParts.length > 1) {
        const oldPath = urlParts[1];
        // Remove query parameters if any
        const cleanPath = oldPath.split("?")[0];
        await supabase.storage.from("avatars").remove([cleanPath]);
      }
    }

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      // Try to delete the uploaded file if update fails
      await supabase.storage.from("avatars").remove([filePath]);
      return errorResponse("Failed to update profile.", 500);
    }

    return successResponse({ avatarUrl: publicUrl });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error.",
      500,
    );
  }
}
