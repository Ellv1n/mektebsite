import { randomInt } from "node:crypto";

/**
 * Sifariş izləmə kodu — müştəri öz sifarişini saytda görmək üçün işlədir.
 *
 * ⚠️ NİYƏ SİFARİŞ NÖMRƏSİ KİFAYƏT ETMİR:
 * `2026-0001`, `2026-0002` ardıcıldır. Yalnız nömrə ilə izləmə olsaydı,
 * kimsə nömrələri bir-bir yazaraq başqa müştərilərin adını, telefonunu və
 * ünvanını oxuya bilərdi. İzləmə kodu təsadüfidir və təxmin edilə bilməz.
 *
 * Əlifba Crockford Base32-dir: `I`, `L`, `O`, `U` yoxdur —
 * telefonda diktə edərkən `0/O` və `1/I/L` qarışmasın deyə.
 * 8 simvol → 32^8 ≈ 1.1 trilyon kombinasiya.
 */

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 8;

/** `K7M2-P9XQ` formatında yeni kod yaradır. */
export function generateTrackingCode(): string {
  let raw = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    raw += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

/**
 * İstifadəçinin yazdığını müqayisə formasına salır.
 * Tire, boşluq və oxşar hərflər nəzərə alınır:
 *   `k7m2 p9xq`, `K7M2-P9XQ`, `k7m2p9xq` → hamısı eyni koda düşür.
 *   `O` → `0`, `I`/`L` → `1` (Crockford qaydası).
 *
 * Kod formaca yanlışdırsa `null` qaytarır.
 */
export function normalizeTrackingCode(input: string): string | null {
  const cleaned = input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");

  if (cleaned.length !== CODE_LENGTH) return null;

  for (const char of cleaned) {
    if (!ALPHABET.includes(char)) return null;
  }

  return cleaned;
}

/** Bazadakı `K7M2P9XQ` formasını ekran üçün `K7M2-P9XQ` edir. */
export function formatTrackingCode(code: string): string {
  const clean = code.replace(/-/g, "");
  return clean.length === CODE_LENGTH ? `${clean.slice(0, 4)}-${clean.slice(4)}` : code;
}

/** Bazada saxlanılan forma — tiresiz, böyük hərflərlə. */
export function storedTrackingCode(code: string): string {
  return code.replace(/-/g, "").toUpperCase();
}
