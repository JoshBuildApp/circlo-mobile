/**
 * v2 Supabase Storage helpers. Files are uploaded to the `avatars` bucket
 * under `<auth_uid>/avatar.<ext>` so the bucket policies (see migration
 * v2_realtime_and_avatars_storage) can scope writes to the owner.
 */
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "avatars";

export interface UploadAvatarResult {
  /** Public URL — safe to embed in <img src> / <Avatar src=...>. */
  publicUrl: string;
  /** Path inside the bucket (e.g. "abc123/avatar.jpg"). */
  path: string;
}

/**
 * Upload a new avatar for the given user. The file is renamed to
 * `<userId>/avatar.<ext>` and `upsert: true` so subsequent uploads
 * replace the previous one (avoids orphaned files).
 *
 * Side effect: also writes the resulting URL to `profiles.avatar_url`
 * for the same user, since that's the column the rest of the app reads.
 */
export async function uploadAvatar(userId: string, file: File): Promise<UploadAvatarResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please pick an image file.");
  }
  // Cap at 5 MB to avoid surprise charges + slow uploads.
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image is over 5 MB. Pick a smaller one.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (uploadErr) {
    console.error("[v2] avatar upload failed:", uploadErr.message);
    throw uploadErr;
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`; // cache-bust

  // Mirror the URL on profiles.avatar_url for everything that reads it.
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("user_id", userId);
  if (updateErr) {
    console.error("[v2] profile avatar_url update failed:", updateErr.message);
    // Don't throw — the file is uploaded; the column update is best-effort.
  }

  return { publicUrl, path };
}
