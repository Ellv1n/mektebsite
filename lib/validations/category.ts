import { z } from "zod";

/**
 * Kateqoriya formasının validasiyası (ecommerce.md §3.3).
 * Eyni sxem həm client, həm server tərəfdə işlədilir (§6).
 */

/** Yalnız öz `/uploads/` qovluğumuzdakı yollar qəbul edilir. */
// ⚠️ `.max()` mütləq `.refine()`-dən ƏVVƏL gəlməlidir — `.refine()` ZodEffects
// qaytarır və onun üzərində sətir metodları yoxdur (tip `unknown`-a düşür).
export const UploadPathSchema = z
  .string()
  .trim()
  .max(300, "Şəkil yolu çox uzundur")
  .startsWith("/uploads/", "Şəkil yolu düzgün deyil")
  .refine((v) => !v.includes(".."), "Şəkil yolu düzgün deyil");

export const CategoryInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Kateqoriyanın adı ən azı 2 hərf olmalıdır")
    .max(100, "Kateqoriyanın adı çox uzundur"),
  image: UploadPathSchema.nullable().optional(),
  order: z
    .number({ invalid_type_error: "Sıra nömrəsi rəqəm olmalıdır" })
    .int("Sıra nömrəsi tam ədəd olmalıdır")
    .min(0, "Sıra nömrəsi mənfi ola bilməz")
    .max(9999, "Sıra nömrəsi çox böyükdür"),
});

export type CategoryInput = z.infer<typeof CategoryInputSchema>;
