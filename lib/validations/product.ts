import { z } from "zod";

import { UploadPathSchema } from "./category";

/**
 * Məhsul formasının validasiyası (ecommerce.md §3.4).
 * Eyni sxem həm client, həm server tərəfdə işlədilir (§6).
 */

const MAX_PRICE = 100_000;

export const ProductInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Məhsulun adı ən azı 2 hərf olmalıdır")
      .max(200, "Məhsulun adı çox uzundur"),

    categoryId: z.string().trim().min(1, "Kateqoriya seçin"),

    price: z
      .number({ invalid_type_error: "Qiymət rəqəm olmalıdır" })
      .positive("Qiymət 0-dan böyük olmalıdır")
      .max(MAX_PRICE, "Qiymət çox böyükdür"),

    salePrice: z
      .number({ invalid_type_error: "Endirimli qiymət rəqəm olmalıdır" })
      .positive("Endirimli qiymət 0-dan böyük olmalıdır")
      .max(MAX_PRICE, "Endirimli qiymət çox böyükdür")
      .nullable()
      .default(null),

    description: z
      .string()
      .trim()
      .max(5000, "Təsvir çox uzundur")
      .nullable()
      .default(null),

    /** Müştəri tərəfindəki rəng dropdown-unu dolduran siyahı. */
    colors: z
      .array(z.string().trim().min(1).max(50))
      .max(30, "Ən çox 30 rəng əlavə etmək olar")
      .default([]),

    images: z.array(UploadPathSchema).max(10, "Ən çox 10 şəkil əlavə etmək olar").default([]),

    stock: z
      .number({ invalid_type_error: "Stok sayı rəqəm olmalıdır" })
      .int("Stok sayı tam ədəd olmalıdır")
      .min(0, "Stok sayı mənfi ola bilməz")
      .max(1_000_000, "Stok sayı çox böyükdür"),

    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
  })
  .refine((d) => d.salePrice === null || d.salePrice < d.price, {
    message: "Endirimli qiymət adi qiymətdən kiçik olmalıdır",
    path: ["salePrice"],
  });

export type ProductInput = z.infer<typeof ProductInputSchema>;

/** `qırmızı, mavi , yaşıl` → `["qırmızı", "mavi", "yaşıl"]` (təkrarsız) */
export function parseColorList(raw: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(",")) {
    const value = part.trim();
    if (!value) continue;
    const key = value.toLocaleLowerCase("az");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}
