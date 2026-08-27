import { DELIVERY_FEE_QEPIK, FREE_DELIVERY_THRESHOLD_QEPIK } from "./constants";

/**
 * Pul hesablamaları.
 *
 * Bütün daxili hesablamalar TAM ƏDƏD (qəpik) üzərində aparılır ki,
 * float yuvarlaqlaşma xətası olmasın (0.1 + 0.2 !== 0.3 problemi).
 * Bazaya yazarkən yenidən "12.50" formatlı sətrə çevrilir.
 */

/** Prisma Decimal, number və ya string qəbul edir. */
export type MoneyInput = number | string | { toString(): string };

/** "12.50" → 1250 qəpik */
export function toQepik(value: MoneyInput): number {
  const s = typeof value === "number" ? value.toFixed(2) : String(value);
  const negative = s.trim().startsWith("-");
  const [wholeRaw, fracRaw = ""] = s.trim().replace("-", "").split(".");
  const whole = parseInt(wholeRaw || "0", 10) || 0;
  const frac = parseInt((fracRaw + "00").slice(0, 2), 10) || 0;
  const total = whole * 100 + frac;
  return negative ? -total : total;
}

/** 1250 → 12.5 (Prisma Decimal sahəsinə yazmaq üçün) */
export function fromQepik(qepik: number): number {
  return Math.round(qepik) / 100;
}

/** 1250 → "12.50" */
export function qepikToString(qepik: number): string {
  return (Math.round(qepik) / 100).toFixed(2);
}

/**
 * Manat dəyərini saytda göstərilən formata salır: 12.5 → "12.50 ₼"
 * Giriş MANATdır (Prisma Decimal, number və ya string).
 */
export function formatAzn(value: MoneyInput): string {
  return `${qepikToString(toQepik(value))} ₼`;
}

/**
 * Qəpikdən formatlayır: 1250 → "12.50 ₼"
 * Hesablama nəticələri üçün bunu işlət — ən dəqiq yoldur.
 */
export function formatQepik(qepik: number): string {
  return `${qepikToString(qepik)} ₼`;
}

/**
 * Endirim məbləği. Yuvarlaqlaşma müştərinin xeyrinə deyil, standart
 * riyazi qaydadadır — admin panelindəki və e-poçtdakı rəqəmlər eyni olsun.
 */
export function calcDiscountQepik(subtotalQepik: number, discountPct: number): number {
  if (discountPct <= 0) return 0;
  const pct = Math.min(Math.max(discountPct, 0), 100);
  return Math.round((subtotalQepik * pct) / 100);
}

/**
 * Çatdırılma haqqı (qəpiklə).
 * `goodsQepik` — endirim tətbiq olunduqdan sonrakı məhsul məbləğidir.
 * Hədd və qiymət `lib/constants.ts`-dədir.
 */
export function calcDeliveryFeeQepik(goodsQepik: number): number {
  if (goodsQepik <= 0) return 0; // boş səbətə çatdırılma yazılmır
  return goodsQepik >= FREE_DELIVERY_THRESHOLD_QEPIK ? 0 : DELIVERY_FEE_QEPIK;
}

/** Pulsuz çatdırılmaya nə qədər qalıb (qəpiklə). Artıq pulsuzdursa 0. */
export function amountUntilFreeDeliveryQepik(goodsQepik: number): number {
  if (goodsQepik <= 0) return FREE_DELIVERY_THRESHOLD_QEPIK;
  return Math.max(0, FREE_DELIVERY_THRESHOLD_QEPIK - goodsQepik);
}

/** Məhsulun saytda göstərilən effektiv qiyməti (endirim varsa o). */
export function effectivePriceQepik(price: MoneyInput, salePrice: MoneyInput | null | undefined): number {
  const base = toQepik(price);
  if (salePrice === null || salePrice === undefined) return base;
  const sale = toQepik(salePrice);
  return sale > 0 && sale < base ? sale : base;
}
