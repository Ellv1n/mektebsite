/**
 * Azərbaycan telefon nömrəsi (ecommerce.md §2.7).
 * Format: +994 XX XXX XX XX
 * Qəbul edilən prefikslər: 050, 051, 055, 070, 077, 010, 099
 */

export const AZ_PREFIXES = ["50", "51", "55", "70", "77", "10", "99"] as const;

/** Rəqəmlərdən başqa hər şeyi atır. */
function digitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * İstifadəçinin yazdığı hər cür formatı `+994501234567` formasına gətirir.
 * Nömrə etibarsızdırsa `null` qaytarır.
 *
 * Qəbul edilən girişlər:
 *   "+994 50 123 45 67", "994501234567", "0501234567", "050 123 45 67", "50 123 45 67"
 */
export function normalizeAzPhone(input: string): string | null {
  let d = digitsOnly(input);

  if (d.startsWith("994")) d = d.slice(3);
  else if (d.startsWith("0")) d = d.slice(1);

  // İndi 9 rəqəm qalmalıdır: 2 prefiks + 7 nömrə
  if (d.length !== 9) return null;

  const prefix = d.slice(0, 2);
  if (!AZ_PREFIXES.includes(prefix as (typeof AZ_PREFIXES)[number])) return null;

  return `+994${d}`;
}

export function isValidAzPhone(input: string): boolean {
  return normalizeAzPhone(input) !== null;
}

/** `+994501234567` → `+994 50 123 45 67` (ekranda göstərmək üçün) */
export function formatAzPhone(normalized: string): string {
  const d = digitsOnly(normalized);
  if (d.length !== 12) return normalized;
  const n = d.slice(3);
  return `+994 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`;
}

export const PHONE_ERROR_MESSAGE = "Telefon nömrəsi düzgün deyil. Nümunə: +994 50 123 45 67";
