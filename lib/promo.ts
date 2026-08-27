/**
 * Promokod normalizasiyası (ecommerce.md §2.6).
 *
 * Tələb: `RTH2026` və `TABİB2026` kodları böyük/kiçik hərfə həssas olmasın,
 * `TABİB2026` (nöqtəli İ) və `TABIB2026` (adi I) variantlarının hər ikisi işləsin.
 *
 * ⚠️ Sıra vacibdir: əvvəl boşluqlar atılır, sonra toUpperCase(), ƏN SONDA
 * İ/ı → I çevrilməsi. Əks halda "tabib2026" düzgün formaya gəlmir.
 *
 * ⚠️ `toLocaleUpperCase("az")` İSTİFADƏ ETMƏ — o, `i` hərfini `İ`-yə çevirir
 * və problemi geri qaytarır. Default locale lazımdır.
 */
export function normalizePromo(input: string): string {
  return input
    .replace(/\s+/g, "") // bütün boşluqları at
    .toUpperCase() // default locale: i→I, ı→I
    .replace(/İ/g, "I") // AZ nöqtəli böyük İ → adi I
    .replace(/ı/g, "I"); // nöqtəsiz ı (böyüməyibsə) → adi I
}

/** Promokodun formaca düzgün olub-olmadığını yoxlayır (bazaya baxmır). */
export function isPromoShapeValid(input: string): boolean {
  const n = normalizePromo(input);
  return n.length >= 3 && n.length <= 32 && /^[A-Z0-9-]+$/.test(n);
}
