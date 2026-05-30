import { supabase } from "@/integrations/supabase/client";

export type MediaFolder = "sections" | "announcements" | "activities";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_DIM = 1280;
const JPEG_QUALITY = 0.82;

/** Resize/compress images client-side so uploads use less bandwidth and storage. */
export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file (JPG, PNG, GIF, or WebP)");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image too large (max 5MB)");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Compression failed"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
  return blob;
}

/** Upload to Supabase Storage; DB stores only the public URL (not base64). */
export async function uploadImageToStorage(
  folder: MediaFolder,
  file: File,
  userId: string
): Promise<string> {
  const blob = await compressImage(file);
  const path = `${folder}/${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("media").upload(path, blob, {
    upsert: true,
    contentType: "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

/** Banner bucket (admin) — same compression, separate bucket for existing RLS. */
export async function uploadBannerImage(file: File, userId: string): Promise<string> {
  const blob = await compressImage(file);
  const path = `${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("banners").upload(path, blob, {
    upsert: true,
    contentType: "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from("banners").getPublicUrl(path);
  return data.publicUrl;
}
