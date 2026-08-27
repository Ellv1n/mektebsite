/**
 * Layihə boyu istifadə olunan sabit dəyərlər və Azərbaycan dilindəki etiketlər.
 */

/** Seed ilə bazaya yazılan başlanğıc kateqoriyalar (ecommerce.md §1). */
export const SEED_CATEGORIES = [
  "Dəftərlər",
  "Gündəliklər",
  "Qələmlər",
  "Rəngli karandaşlar",
  "Flomasterlər",
  "Boyalar",
  "Kley",
  "Kitablar",
  "Dəftər üzləri",
  "Albomlar",
  "Rəngli kağızlar",
  "Penallar",
  "Termoslar",
  "Pozanlar",
  "Yonanlar",
  "Xətkeşlər",
  "Pərgarlar",
  "Digər",
] as const;

/** Səbətdəki "Kimin üçün" seçimi (ecommerce.md §2.4). */
export const GENDERS = ["OGLAN", "QIZ", "FERQI_YOXDUR"] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  OGLAN: "Oğlan",
  QIZ: "Qız",
  FERQI_YOXDUR: "Fərqi yoxdur",
};

export const DEFAULT_GENDER: Gender = "FERQI_YOXDUR";

/** Sifariş statusları və AZ qarşılıqları. */
export const ORDER_STATUSES = [
  "NEW",
  "CONFIRMED",
  "SHIPPING",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  NEW: "Yeni",
  CONFIRMED: "Təsdiqləndi",
  SHIPPING: "Yolda",
  DELIVERED: "Çatdırıldı",
  CANCELLED: "Ləğv edildi",
};

/** Admin paneldə status nişanının rəngi (Tailwind class-ları). */
export const ORDER_STATUS_STYLES: Record<OrderStatusValue, string> = {
  NEW: "bg-orange-100 text-orange-800 ring-orange-300",
  CONFIRMED: "bg-blue-100 text-blue-800 ring-blue-300",
  SHIPPING: "bg-amber-100 text-amber-800 ring-amber-300",
  DELIVERED: "bg-green-100 text-green-800 ring-green-300",
  CANCELLED: "bg-red-100 text-red-800 ring-red-300",
};

/** Yeganə ödəniş üsulu (ecommerce.md §0/§2.7 — onlayn ödəniş YOXDUR). */
export const PAYMENT_METHOD = "CASH_ON_DELIVERY";
export const PAYMENT_METHOD_LABEL = "Nağd ödəniş (çatdırılma zamanı)";

/**
 * Çatdırılma haqqı.
 * 30 ₼ və yuxarı sifarişlərdə pulsuz, aşağıda 5 ₼ əlavə olunur.
 *
 * Hədd ENDİRİMDƏN SONRAKI məbləğə görə hesablanır — müştəri nə qədər
 * ödəyirsə, ona baxılır. Əgər endirimdən ƏVVƏLKİ məbləğə görə olmasını
 * istəyirsinizsə, `lib/money.ts` → `calcDeliveryFeeQepik` çağırışında
 * `subtotalQepik` ötürün.
 */
export const FREE_DELIVERY_THRESHOLD_QEPIK = 3000; // 30.00 ₼
export const DELIVERY_FEE_QEPIK = 500; // 5.00 ₼

/** Səbətin localStorage açarı. */
export const CART_STORAGE_KEY = "sederek-cart-v1";

/** Tətbiq edilmiş promokodun localStorage açarı. */
export const PROMO_STORAGE_KEY = "sederek-promo-v1";

/** Şəkil yükləmə limitləri (ecommerce.md §6). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** Məhsul siyahısında bir səhifədəki məhsul sayı. */
export const PRODUCTS_PER_PAGE = 12;

/**
 * Mağazanın məlumatları — saytda ad, telefon və ünvan YALNIZ buradan gəlir.
 * Adı dəyişmək üçün yalnız bu faylı redaktə etmək kifayətdir.
 */
export const STORE_INFO = {
  name: "Məktəbli Səbəti",
  tagline: "Məktəb ləvazimatları",
  phone: "+994 70 871 44 22",
  /** `tel:` linki üçün — boşluqsuz forma */
  phoneHref: "+994708714422",
  /** wa.me formatı: ölkə kodu ilə, "+" və boşluq olmadan */
  whatsappNumber: "994708714422",
  address: "Sədərək Ticarət Mərkəzi, Şirniyyat bazarı, sıra 7, mağaza 33",
  workingHours: "Hər gün 09:00 — 20:00",
};

/** WhatsApp söhbətini hazır salamla açan link. */
export function whatsappLink(message = "Salam! Məktəbli Səbəti haqqında məlumat almaq istəyirəm."): string {
  return `https://wa.me/${STORE_INFO.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
