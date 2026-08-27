import { DEFAULT_GENDER, GENDERS, type Gender } from "./constants";

/**
 * Səbətin məlumat modeli (ecommerce.md §2.4, §2.5).
 *
 * ⚠️ Ən vacib qayda: səbətdəki elementin kimliyi
 *    `productId + rəng + kimin üçün + qeyd`
 * kombinasiyasıdır. Eyni məhsul fərqli rənglə əlavə olunanda AYRI SƏTİR olur,
 * sayı artmır.
 *
 * Qiymət qəpik (tam ədəd) kimi saxlanılır — float yuvarlaqlaşma xətası olmasın.
 * Bu, yalnız ekranda göstərmək üçündür: yekun məbləği server yenidən hesablayır.
 */

export type CartItem = {
  /** productId|color|gender|note əsasında yaradılan təkrarsız açar */
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  /** Endirim nəzərə alınmış effektiv qiymət, qəpiklə */
  priceQepik: number;
  quantity: number;
  color: string | null;
  gender: Gender;
  note: string | null;
  /** Sayın yuxarı həddi üçün — sifariş anında server yenidən yoxlayır */
  stock: number;
  /**
   * Admin tərəfindən məhsula təyin edilmiş rənglər.
   * Səbətdə rəngi redaktə edərkən eyni dropdown göstərilsin deyə saxlanılır.
   */
  availableColors: string[];
};

/** Səbətə əlavə edilərkən lazım olan minimum məlumat. */
export type CartItemInput = Omit<CartItem, "key">;

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase("az");
}

export function cartItemKey(input: {
  productId: string;
  color: string | null;
  gender: Gender;
  note: string | null;
}): string {
  return [input.productId, normalize(input.color), input.gender, normalize(input.note)].join("|");
}

/**
 * Müştərinin tətbiq etdiyi promokod.
 * ⚠️ Bu, yalnız ekranda göstərmək üçündür — sifariş anında server
 * kodu və faizi bazadan yenidən oxuyur (ecommerce.md §6).
 */
export type AppliedPromo = { code: string; discountPct: number };

export function parseStoredPromo(raw: string | null): AppliedPromo | null {
  if (!raw) return null;

  try {
    const data = JSON.parse(raw) as unknown;
    if (typeof data !== "object" || data === null) return null;

    const e = data as Record<string, unknown>;
    if (typeof e.code !== "string" || e.code.trim() === "") return null;
    if (typeof e.discountPct !== "number" || !Number.isFinite(e.discountPct)) return null;

    const pct = Math.round(e.discountPct);
    if (pct <= 0 || pct > 100) return null;

    return { code: e.code.trim(), discountPct: pct };
  } catch {
    return null;
  }
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubtotalQepik(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.priceQepik * item.quantity, 0);
}

/**
 * localStorage-dən oxunan məlumatı yoxlayır.
 * Pozuq və ya köhnə formatlı qeydlər səssizcə atılır — səbət heç vaxt
 * səhifəni sındırmamalıdır.
 */
export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(data)) return [];

  const items: CartItem[] = [];

  for (const entry of data) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Record<string, unknown>;

    if (
      typeof e.productId !== "string" ||
      typeof e.slug !== "string" ||
      typeof e.name !== "string" ||
      typeof e.priceQepik !== "number" ||
      !Number.isFinite(e.priceQepik) ||
      typeof e.quantity !== "number" ||
      !Number.isInteger(e.quantity) ||
      e.quantity < 1
    ) {
      continue;
    }

    const gender = GENDERS.includes(e.gender as Gender) ? (e.gender as Gender) : DEFAULT_GENDER;
    const color = typeof e.color === "string" && e.color.trim() !== "" ? e.color.trim() : null;
    const note = typeof e.note === "string" && e.note.trim() !== "" ? e.note.trim() : null;

    const base = {
      productId: e.productId,
      slug: e.slug,
      name: e.name,
      image: typeof e.image === "string" ? e.image : null,
      priceQepik: Math.max(0, Math.round(e.priceQepik)),
      quantity: Math.min(e.quantity, 999),
      color,
      gender,
      note,
      stock: typeof e.stock === "number" && Number.isFinite(e.stock) ? e.stock : 0,
      availableColors: Array.isArray(e.availableColors)
        ? e.availableColors.filter((c): c is string => typeof c === "string")
        : [],
    };

    items.push({ ...base, key: cartItemKey(base) });
  }

  return items;
}
