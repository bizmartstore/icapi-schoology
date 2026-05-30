/** Tiny avatar as a data URL — stored in DB, no storage bucket quota. */
const AVATAR_DIM = 96;
const AVATAR_QUALITY = 0.72;
const MAX_BYTES = 2 * 1024 * 1024;

export async function compressToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file (JPG, PNG, GIF, or WebP)");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image too large (max 2MB for avatar)");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, AVATAR_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", AVATAR_QUALITY);
  if (dataUrl.length > 48_000) {
    throw new Error("Avatar still too large after compression — try a smaller image");
  }
  return dataUrl;
}
