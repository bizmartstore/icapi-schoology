/** Event carousel images as data URLs — stored in DB, no storage bucket quota. */
const EVENT_DIM = 720;
const EVENT_QUALITY = 0.75;
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_DATA_URL_LEN = 120_000;

export async function compressToEventDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file (JPG, PNG, GIF, or WebP)");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image too large (max 3MB)");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, EVENT_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", EVENT_QUALITY);
  if (dataUrl.length > MAX_DATA_URL_LEN) {
    throw new Error("Image still too large after compression — try a smaller or simpler image");
  }
  return dataUrl;
}
