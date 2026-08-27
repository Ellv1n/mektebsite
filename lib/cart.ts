/**
 * Səbətin məlumat modeli (ecommerce.md §2.4, §2.5).
 *
 * ⚠️ Ən vacib qayda: səbətdəki elementin kimliyi
 *    `productId + variant (şəkil) + rəng + qeyd`
 * kombinasiyasıdır. Eyni məhsul fərqli variant və ya rənglə əlavə olunanda
 * AYRI SƏTİR olur, sayı artmır — beləliklə admin panelində müştərinin
 * hansı variantdan neçə ədəd istədiyi dəqiq görünür.
 *
 * Qiymət qəpik (tam ədəd) kimi saxlanılır — float yuvarlaqlaşma xətası olmasın.
 * Bu, yalnız ekranda göstərmək üçündür: yekun məbləği server yenidən hesablayır.
 */

export type CartItem = {
  /** productId|imageIndex|color|note əsasında yaradılan təkrarsız açar */
  key: string;
  productId: string;
  slug: string;
  name: string;
  /** Müştərinin seçdiyi variantın şəkli */
  image: string | null;
  /** Seçilmiş variantın məhsulun şəkil siyahısındakı sırası (0-dan başlayır) */
  imageIndex: number;
  /** Endirim nəzərə alınmış effektiv qiymət, qəpiklə */
  priceQepik: number;
  quantity: number;
  color: string | null;
  note: string | null;
  /** Sayın yuxarı həddi üçün — sifariş anında server yenidən yoxlayır */
  stock: number;
  /**
   * Admin tərəfindən məhsula təyin edilmiş rənglər.
   * Səbətdə rəngi redaktə edərkən eyni dropdown göstərilsin deyə saxlanılır.
   */
  availableColors: string[];
  /**
   * Məhsulun bütün şəkilləri — səbətdə variantı dəyişmək üçün.
   * Bir şəkil varsa variant seçimi ümumiyyətlə göstərilmir.
   */
  availableImages: string[];
};

/** Səbətə əlavə edilərkən lazım olan minimum məlumat. */
export type CartItemInput = Omit<CartItem, "key">;

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase("az");
}

export function cartItemKey(input: {
  productId: string;
  imageIndex: number;
  color: string | null;
  note: string | null;
}): string {
  return [input.productId, input.imageIndex, normalize(input.color), normalize(input.note)].join("|");
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

    const color = typeof e.color === "string" && e.color.trim() !== "" ? e.color.trim() : null;
    const note = typeof e.note === "string" && e.note.trim() !== "" ? e.note.trim() : null;

    const availableImages = Array.isArray(e.availableImages)
      ? e.availableImages.filter((i): i is string => typeof i === "string")
      : [];

    // Köhnə səbətdə (variant əlavə edilməzdən əvvəl) bu sahə yoxdur → əsas şəkil
    const imageIndex =
      typeof e.imageIndex === "number" && Number.isInteger(e.imageIndex) && e.imageIndex >= 0
        ? e.imageIndex
        : 0;

    const base = {
      productId: e.productId,
      slug: e.slug,
      name: e.name,
      image: typeof e.image === "string" ? e.image : null,
      imageIndex: availableImages.length > 0 ? Math.min(imageIndex, availableImages.length - 1) : imageIndex,
      priceQepik: Math.max(0, Math.round(e.priceQepik)),
      quantity: Math.min(e.quantity, 999),
      color,
      note,
      stock: typeof e.stock === "number" && Number.isFinite(e.stock) ? e.stock : 0,
      availableColors: Array.isArray(e.availableColors)
        ? e.availableColors.filter((c): c is string => typeof c === "string")
        : [],
      availableImages,
    };

    items.push({ ...base, key: cartItemKey(base) });
  }

  return items;
}

/** Variantın müştəriyə göstərilən adı — məs. "Variant 3". */
export function variantLabel(imageIndex: number): string {
  return `Variant ${imageIndex + 1}`;
}
