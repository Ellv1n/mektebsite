/**
 * Azərbaycan dilindəki adları URL üçün təhlükəsiz slug-a çevirir.
 * Məsələn: "Dəftərlər" → "defterler", "Rəngli karandaşlar" → "rengli-karandaslar"
 */

const AZ_MAP: Record<string, string> = {
  ə: "e",
  Ə: "e",
  ı: "i",
  I: "i",
  İ: "i",
  i: "i",
  ö: "o",
  Ö: "o",
  ü: "u",
  Ü: "u",
  ç: "c",
  Ç: "c",
  ş: "s",
  Ş: "s",
  ğ: "g",
  Ğ: "g",
  // rus qablaşdırma adları kataloqa düşərsə
  й: "y",
  ъ: "",
  ь: "",
};

// NFD-dən sonra qalan birləşən diakritik işarələri (U+0300–U+036F) atmaq üçün.
// new RegExp ilə yazılıb ki, fayl kodlaşdırmasından asılı olmasın.
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

export function slugify(input: string): string {
  const transliterated = Array.from(input)
    .map((ch) => (ch in AZ_MAP ? AZ_MAP[ch] : ch))
    .join("");

  return transliterated
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-") // hərf/rəqəm olmayan hər şey tire
    .replace(/-{2,}/g, "-") // təkrar tireləri birləşdir
    .replace(/^-+|-+$/g, ""); // baş və son tireləri sil
}

/**
 * Slug artıq mövcuddursa sonuna nömrə əlavə edir: "defter", "defter-2", "defter-3"
 */
export function uniqueSlug(base: string, taken: Set<string>): string {
  const slug = slugify(base) || "mehsul";
  if (!taken.has(slug)) {
    taken.add(slug);
    return slug;
  }
  let n = 2;
  while (taken.has(`${slug}-${n}`)) n++;
  const result = `${slug}-${n}`;
  taken.add(result);
  return result;
}
