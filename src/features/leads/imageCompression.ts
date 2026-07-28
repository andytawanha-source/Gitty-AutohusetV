/**
 * Klient-side billedkomprimering før upload (spec pkt. 10, trin 4).
 * Skalerer til maks. 1920 px og komprimerer til JPEG/WebP under ~800 KB.
 */

const MAX_DIMENSION = 1920;
const TARGET_BYTES = 800 * 1024;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    return "Filtypen understøttes ikke. Brug JPEG, PNG, WebP eller HEIC.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Billedet er for stort (maks. 10 MB).";
  }
  return null;
}

export async function compressImage(file: File): Promise<File> {
  // HEIC og små filer sendes uændret (serverside håndtering/allerede små)
  if (file.size <= TARGET_BYTES || /heic|heif/i.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    for (const quality of [0.82, 0.7, 0.58]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
      if (blob && (blob.size <= TARGET_BYTES || quality === 0.58)) {
        return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
      }
    }
    return file;
  } catch {
    // Komprimering må aldrig blokere upload
    return file;
  }
}
