import { randomBytes } from "node:crypto";

import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "./constants";

/**
 * Şəkil yükləməsinin təhlükəsizlik yoxlamaları (ecommerce.md §6).
 *
 * Üç qat qoruma:
 *   1. Ölçü limiti (5 MB)
 *   2. MIME tipi + uzantı ağ siyahısı
 *   3. Faylın ilk baytlarının (magic bytes) həqiqətən şəkil olduğunu təsdiqi —
 *      uzadılmış .jpg adı ilə göndərilən skript bu mərhələdə tutulur
 *
 * Fayl adı ümumiyyətlə istifadəçidən götürülmür: təsadüfi ad yaradılır,
 * beləliklə path traversal (`../../`) mümkün deyil.
 */

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type UploadCheck =
  | { ok: true; extension: string }
  | { ok: false; error: string };

/** Faylın ilk baytlarına baxaraq həqiqi tipini müəyyən edir. */
function sniffImageType(bytes: Uint8Array): string | null {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((b, i) => bytes[i] === b)) {
    return "image/png";
  }
  // WEBP: "RIFF" .... "WEBP"
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export function checkUpload(declaredType: string, size: number, head: Uint8Array): UploadCheck {
  if (size <= 0) {
    return { ok: false, error: "Fayl boşdur." };
  }

  if (size > MAX_UPLOAD_BYTES) {
    const mb = (MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0);
    return { ok: false, error: `Faylın ölçüsü ${mb} MB-dan çox ola bilməz.` };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(declaredType as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return { ok: false, error: "Yalnız JPG, PNG və WEBP formatları qəbul edilir." };
  }

  const actualType = sniffImageType(head);
  if (!actualType) {
    return { ok: false, error: "Fayl həqiqi şəkil deyil." };
  }
  if (actualType !== declaredType) {
    return {
      ok: false,
      error: "Faylın məzmunu uzantısına uyğun gəlmir. Şəkli yenidən yadda saxlayıb sınayın.",
    };
  }

  return { ok: true, extension: EXTENSION_BY_TYPE[actualType] };
}

/**
 * Təhlükəsiz fayl adı yaradır. İstifadəçinin göndərdiyi ad işlədilmir —
 * yalnız oxunaqlıq üçün qısa "slug" hissəsi əlavə oluna bilər.
 */
export function generateUploadName(extension: string): string {
  const stamp = Date.now().toString(36);
  const random = randomBytes(6).toString("hex");
  return `${stamp}-${random}.${extension}`;
}
