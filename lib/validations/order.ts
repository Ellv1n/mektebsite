import { z } from "zod";

import { GENDERS } from "../constants";
import { isValidAzPhone, PHONE_ERROR_MESSAGE } from "../phone";

/**
 * Sifariş formasının validasiyası (ecommerce.md §2.7).
 * Eyni sxem həm client, həm də server tərəfdə işlədilir (§6).
 *
 * ⚠️ Məbləğ sahələri BURADA YOXDUR. Ara cəmi, endirim və yekum məbləğ
 * yalnız serverdə, bazadakı qiymətlər əsasında hesablanır — müştəridən
 * gələn məbləğə etibar edilmir.
 */

export const OrderItemInputSchema = z.object({
  productId: z.string().trim().min(1, "Məhsul seçilməyib"),
  quantity: z
    .number({ invalid_type_error: "Say rəqəm olmalıdır" })
    .int("Say tam ədəd olmalıdır")
    .min(1, "Say ən azı 1 olmalıdır")
    .max(999, "Say çox böyükdür"),
  color: z.string().trim().max(50, "Rəng adı çox uzundur").nullable().default(null),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: "Kimin üçün olduğunu seçin" }) }),
  note: z.string().trim().max(500, "Qeyd çox uzundur").nullable().default(null),
});

export const OrderInputSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Ad ən azı 2 hərf olmalıdır")
    .max(50, "Ad çox uzundur"),

  lastName: z
    .string()
    .trim()
    .min(2, "Soyad ən azı 2 hərf olmalıdır")
    .max(50, "Soyad çox uzundur"),

  phone: z
    .string()
    .trim()
    .min(1, "Telefon nömrəsini daxil edin")
    .refine(isValidAzPhone, PHONE_ERROR_MESSAGE),

  // Könüllü sahə: boş göndərilirsə `null` olmalıdır
  email: z
    .string()
    .trim()
    .max(200, "E-poçt ünvanı çox uzundur")
    .email("E-poçt ünvanı düzgün deyil")
    .nullable()
    .default(null),

  city: z
    .string()
    .trim()
    .min(2, "Şəhər və ya rayonu daxil edin")
    .max(100, "Şəhər adı çox uzundur"),

  address: z
    .string()
    .trim()
    .min(5, "Ünvanı ətraflı yazın: küçə, bina, mənzil")
    .max(500, "Ünvan çox uzundur"),

  note: z.string().trim().max(1000, "Qeyd çox uzundur").nullable().default(null),

  promoCode: z.string().trim().max(32, "Promokod çox uzundur").nullable().default(null),

  items: z
    .array(OrderItemInputSchema)
    .min(1, "Səbətiniz boşdur")
    .max(100, "Səbətdə çox məhsul var"),
});

export type OrderInput = z.infer<typeof OrderInputSchema>;
export type OrderItemInput = z.infer<typeof OrderItemInputSchema>;
