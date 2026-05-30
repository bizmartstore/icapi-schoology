/** Section cover as a data URL — stored in DB, no storage bucket quota. */
const SECTION_COVER_DIM = 640;
const SECTION_COVER_QUALITY = 0.72;
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_DATA_URL_LEN = 100_000;

export async function compressToSectionCoverDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file (JPG, PNG, GIF, or WebP)");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image too large (max 3MB)");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, SECTION_COVER_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", SECTION_COVER_QUALITY);
  if (dataUrl.length > MAX_DATA_URL_LEN) {
    throw new Error("Image still too large after compression — try a smaller image");
  }
  return dataUrl;
}

export function getSectionCoverSrc(section: {
  cover_image_data?: string | null;
  cover_image_url?: string | null;
}): string | null {
  const data = section.cover_image_data?.trim();
  if (data) return data;
  const url = section.cover_image_url?.trim();
  return url || null;
}
