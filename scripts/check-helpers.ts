/**
 * Köməkçi funksiyaların yoxlanması.
 * İşə salmaq:  npm run check
 *
 * Burada spesifikasiyanın ən tələ dolu yerləri yoxlanılır:
 *   - TABİB2026 / TABIB2026 promokod normalizasiyası (ecommerce.md §2.6)
 *   - Azərbaycan telefon prefiksləri (ecommerce.md §2.7)
 *   - Pul hesablamalarında float yuvarlaqlaşma xətası
 *   - Azərbaycan hərflərinin slug-a çevrilməsi
 */

import { normalizePromo } from "../lib/promo";
import { normalizeAzPhone, formatAzPhone } from "../lib/phone";
import {
  toQepik,
  formatQepik,
  calcDiscountQepik,
  calcDeliveryFeeQepik,
  amountUntilFreeDeliveryQepik,
  formatAzn,
} from "../lib/money";
import { slugify } from "../lib/slug";
import {
  formatTrackingCode,
  generateTrackingCode,
  normalizeTrackingCode,
  storedTrackingCode,
} from "../lib/tracking-code";
import {
  cartItemKey,
  cartCount,
  cartSubtotalQepik,
  parseStoredCart,
  parseStoredPromo,
} from "../lib/cart";

let fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  const ok = String(got) === String(want);
  if (!ok) fail++;
  console.log(`${ok ? "OK  " : "FAIL"}  ${label}  →  ${got}${ok ? "" : `   (gözlənilən: ${want})`}`);
}

console.log("\n--- PROMOKOD ---");
for (const v of ["TABİB2026", "TABIB2026", "tabib2026", "Tabıb2026", " tabİb 2026 "]) {
  eq(`normalizePromo("${v}")`, normalizePromo(v), "TABIB2026");
}
for (const v of ["RTH2026", "rth2026", "Rth2026", " rth 2026 "]) {
  eq(`normalizePromo("${v}")`, normalizePromo(v), "RTH2026");
}

console.log("\n--- TELEFON ---");
eq('"+994 50 123 45 67"', normalizeAzPhone("+994 50 123 45 67"), "+994501234567");
eq('"0501234567"', normalizeAzPhone("0501234567"), "+994501234567");
eq('"994701234567"', normalizeAzPhone("994701234567"), "+994701234567");
eq('"055 123 45 67"', normalizeAzPhone("055 123 45 67"), "+994551234567");
eq('"010-123-45-67"', normalizeAzPhone("010-123-45-67"), "+994101234567");
eq('"099 123 45 67"', normalizeAzPhone("099 123 45 67"), "+994991234567");
eq('"+994 60 123 45 67" (səhv prefiks)', normalizeAzPhone("+994 60 123 45 67"), "null");
eq('"050 123 45" (qısa)', normalizeAzPhone("050 123 45"), "null");
eq("formatAzPhone", formatAzPhone("+994501234567"), "+994 50 123 45 67");

console.log("\n--- PUL ---");
eq("toQepik(12.5)", toQepik(12.5), 1250);
eq('toQepik("0.05")', toQepik("0.05"), 5);
eq('toQepik("100")', toQepik("100"), 10000);
eq("0.1 + 0.2 float tələsi", toQepik(0.1) + toQepik(0.2), 30);
eq("formatQepik(4500)", formatQepik(4500), "45.00 ₼");
eq("formatAzn(12.5)", formatAzn(12.5), "12.50 ₼");
eq("50.00 ₼ üzərindən 10%", formatQepik(calcDiscountQepik(toQepik(50), 10)), "5.00 ₼");
eq("yekun 50 - 10%", formatQepik(toQepik(50) - calcDiscountQepik(toQepik(50), 10)), "45.00 ₼");
eq("3.33 ₼ üzərindən 10% (yuvarlaqlaşma)", calcDiscountQepik(toQepik(3.33), 10), 33);

console.log("\n--- SLUG ---");
eq('"Dəftərlər"', slugify("Dəftərlər"), "defterler");
eq('"Rəngli karandaşlar"', slugify("Rəngli karandaşlar"), "rengli-karandaslar");
eq('"Dəftər üzləri"', slugify("Dəftər üzləri"), "defter-uzleri");
eq('"Xətkeşlər"', slugify("Xətkeşlər"), "xetkesler");
eq('"Pərgarlar"', slugify("Pərgarlar"), "pergarlar");
eq('"Gündəliklər"', slugify("Gündəliklər"), "gundelikler");
eq('"Digər"', slugify("Digər"), "diger");
eq('"Plastilin — 12 rəng"', slugify("Plastilin — 12 rəng"), "plastilin-12-reng");

console.log("\n--- SƏBƏT (ecommerce.md §2.4) ---");
const baseItem = { productId: "p1", imageIndex: 0, color: "qırmızı", note: null };

eq(
  "eyni məhsul + eyni seçim → EYNİ açar",
  cartItemKey(baseItem) === cartItemKey({ ...baseItem }),
  true
);
eq(
  "eyni məhsul + fərqli RƏNG → AYRI açar",
  cartItemKey(baseItem) !== cartItemKey({ ...baseItem, color: "mavi" }),
  true
);
eq(
  "eyni məhsul + fərqli VARİANT (şəkil) → AYRI açar",
  cartItemKey(baseItem) !== cartItemKey({ ...baseItem, imageIndex: 2 }),
  true
);
eq(
  "eyni məhsul + fərqli QEYD → AYRI açar",
  cartItemKey(baseItem) !== cartItemKey({ ...baseItem, note: "maşın şəkli olsun" }),
  true
);
eq(
  "rəngdə böyük/kiçik hərf fərqi → EYNİ açar",
  cartItemKey({ ...baseItem, color: "QIRMIZI" }) === cartItemKey({ ...baseItem, color: "qırmızı" }),
  true
);
eq(
  "fərqli məhsul, eyni seçim → AYRI açar",
  cartItemKey(baseItem) !== cartItemKey({ ...baseItem, productId: "p2" }),
  true
);

const stored = JSON.stringify([
  { productId: "p1", slug: "a", name: "A", image: null, imageIndex: 0, priceQepik: 250, quantity: 2, color: "mavi", note: null, stock: 10 },
  { productId: "p1", slug: "a", name: "A", image: null, imageIndex: 2, priceQepik: 250, quantity: 1, color: "mavi", note: null, stock: 10 },
  { productId: "x", quantity: 0 },
  "pozuq sətir",
  // Köhnə formatlı qeyd — variant sahəsi yoxdur, əsas şəklə düşməlidir
  { productId: "p2", slug: "b", name: "B", image: null, priceQepik: 1000, quantity: 1, color: null, gender: "QIZ", note: null, stock: 5 },
]);
const parsed = parseStoredCart(stored);
eq("pozuq qeydlər atılır", parsed.length, 3);
eq("ümumi say", cartCount(parsed), 4);
eq("ara cəmi", formatQepik(cartSubtotalQepik(parsed)), "17.50 ₼");
eq("variant seçimi saxlanılır", parsed[1].imageIndex, 2);
eq("köhnə səbət qeydi → əsas variant", parsed[2].imageIndex, 0);
eq(
  "eyni rəng, fərqli variant → AYRI sətir",
  parsed[0].key !== parsed[1].key,
  true
);
eq("boş localStorage", parseStoredCart(null).length, 0);
eq("pozuq JSON", parseStoredCart("{{{").length, 0);

console.log("\n--- PROMOKOD SAXLANCI ---");
eq(
  "düzgün qeyd",
  JSON.stringify(parseStoredPromo('{"code":"RTH2026","discountPct":10}')),
  '{"code":"RTH2026","discountPct":10}'
);
eq("100%-dən böyük faiz atılır", parseStoredPromo('{"code":"X","discountPct":150}'), "null");
eq("mənfi faiz atılır", parseStoredPromo('{"code":"X","discountPct":-10}'), "null");
eq("boş kod atılır", parseStoredPromo('{"code":"","discountPct":10}'), "null");
eq("pozuq JSON", parseStoredPromo("{{{"), "null");
eq("boş dəyər", parseStoredPromo(null), "null");

console.log("\n--- ÇATDIRILMA HAQQI (30 ₼-dən yuxarı pulsuz) ---");
eq("29.99 ₼ → 5.00 ₼", formatQepik(calcDeliveryFeeQepik(toQepik(29.99))), "5.00 ₼");
eq("30.00 ₼ → pulsuz", calcDeliveryFeeQepik(toQepik(30)), 0);
eq("30.01 ₼ → pulsuz", calcDeliveryFeeQepik(toQepik(30.01)), 0);
eq("0.01 ₼ → 5.00 ₼", formatQepik(calcDeliveryFeeQepik(toQepik(0.01))), "5.00 ₼");
eq("boş səbət → 0", calcDeliveryFeeQepik(0), 0);
eq("29.99 ₼-ə qalan", formatQepik(amountUntilFreeDeliveryQepik(toQepik(29.99))), "0.01 ₼");
eq("30 ₼-də qalan yoxdur", amountUntilFreeDeliveryQepik(toQepik(30)), 0);

{
  // Endirim həddi aşağı sala bilər: 32 ₼ − 10% = 28.80 ₼ → çatdırılma ödənişlidir
  const subtotal = toQepik(32);
  const discount = calcDiscountQepik(subtotal, 10);
  const goods = subtotal - discount;
  eq("32 ₼ − 10% = məhsul məbləği", formatQepik(goods), "28.80 ₼");
  eq("  → çatdırılma", formatQepik(calcDeliveryFeeQepik(goods)), "5.00 ₼");
  eq("  → yekun", formatQepik(goods + calcDeliveryFeeQepik(goods)), "33.80 ₼");
}
{
  // 50 ₼ − 10% = 45 ₼ → pulsuz
  const subtotal = toQepik(50);
  const discount = calcDiscountQepik(subtotal, 10);
  const goods = subtotal - discount;
  eq("50 ₼ − 10% → çatdırılma", calcDeliveryFeeQepik(goods), 0);
  eq("  → yekun", formatQepik(goods + calcDeliveryFeeQepik(goods)), "45.00 ₼");
}

console.log("\n--- İZLƏMƏ KODU ---");
{
  const canonical = "5Q8X43XS";
  eq('"5Q8X-43XS"', normalizeTrackingCode("5Q8X-43XS"), canonical);
  eq('"5q8x43xs" (kiçik hərf)', normalizeTrackingCode("5q8x43xs"), canonical);
  eq('"5Q8X 43XS" (boşluqla)', normalizeTrackingCode("5Q8X 43XS"), canonical);
  eq('" 5q8x-43xs "', normalizeTrackingCode(" 5q8x-43xs "), canonical);

  // Crockford qaydası: oxşar hərflər rəqəmə çevrilir
  eq('"O" → "0"', normalizeTrackingCode("OQ8X43XS"), "0Q8X43XS");
  eq('"I" → "1"', normalizeTrackingCode("IQ8X43XS"), "1Q8X43XS");
  eq('"L" → "1"', normalizeTrackingCode("LQ8X43XS"), "1Q8X43XS");

  eq("qısa kod rədd edilir", normalizeTrackingCode("ABC"), "null");
  eq("uzun kod rədd edilir", normalizeTrackingCode("ABCD-EFGH-IJKL"), "null");
  eq("boş dəyər rədd edilir", normalizeTrackingCode(""), "null");
  eq('əlifbada olmayan "U" rədd edilir', normalizeTrackingCode("UUUUUUUU"), "null");

  eq("formatTrackingCode", formatTrackingCode(canonical), "5Q8X-43XS");
  eq("storedTrackingCode", storedTrackingCode("5q8x-43xs"), canonical);

  // Yaradılan kod öz normalizasiyasından keçməlidir
  let generatedOk = true;
  const seen = new Set<string>();
  for (let i = 0; i < 500; i++) {
    const code = generateTrackingCode();
    if (!/^[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(code)) generatedOk = false;
    if (normalizeTrackingCode(code) !== storedTrackingCode(code)) generatedOk = false;
    seen.add(code);
  }
  eq("500 kod: format və normalizasiya", generatedOk, true);
  eq("500 kod: təkrar yoxdur", seen.size, 500);
}

console.log("\n--- ENDİRİM GÖSTƏRİŞİ (§2.6 nümunəsi) ---");
{
  const subtotal = toQepik(50);
  const discount = calcDiscountQepik(subtotal, 10);
  eq("Ara cəmi", formatQepik(subtotal), "50.00 ₼");
  eq("Endirim (RTH2026, 10%)", "−" + formatQepik(discount), "−5.00 ₼");
  eq("Yekun", formatQepik(subtotal - discount), "45.00 ₼");
}

console.log(fail === 0 ? "\n✓ HAMISI KEÇDİ\n" : `\n✗ ${fail} TEST UĞURSUZ\n`);
process.exit(fail === 0 ? 0 : 1);
