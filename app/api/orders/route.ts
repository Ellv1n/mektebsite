import { NextResponse } from "next/server";

import { badRequest, readJsonBody, zodErrorResponse } from "@/lib/api";
import { variantLabel } from "@/lib/cart";
import { PAYMENT_METHOD } from "@/lib/constants";
import { renderOrderEmail, type OrderEmailItem } from "@/lib/email/order-notification";
import { sendMail } from "@/lib/mail";
import {
  calcDeliveryFeeQepik,
  calcDiscountQepik,
  effectivePriceQepik,
  fromQepik,
} from "@/lib/money";
import { nextOrderNumber } from "@/lib/order-number";
import { normalizeAzPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { normalizePromo } from "@/lib/promo";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { formatTrackingCode, generateTrackingCode, storedTrackingCode } from "@/lib/tracking-code";
import { OrderInputSchema } from "@/lib/validations/order";

/**
 * Sifarişin yaradılması (ecommerce.md §2.7, §2.8).
 *
 * ⚠️ Bütün məbləğlər BURADA, bazadakı qiymətlər əsasında hesablanır.
 * Müştərinin göndərdiyi heç bir məbləğə etibar edilmir (§6).
 *
 * ⚠️ E-poçt göndərilməsə də sifariş bazada qalır — xəta yalnız log-a yazılır (§2.8).
 */

// 10 dəqiqədə maksimum 10 sifariş (eyni IP-dən)
const MAX_ORDERS = 10;
const WINDOW_MS = 10 * 60 * 1000;

/** Stok çatmayanda tranzaksiyanı dayandırmaq üçün. */
class OutOfStockError extends Error {
  constructor(public productName: string, public available: number) {
    super("stok çatmır");
  }
}

/**
 * Bazada təkrarlanmayan izləmə kodu yaradır.
 * 32^8 ≈ 1.1 trilyon variant olduğuna görə toqquşma praktiki olaraq baş vermir,
 * amma yenə də yoxlanılır.
 */
async function uniqueTrackingCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = storedTrackingCode(generateTrackingCode());
    const existing = await prisma.order.findUnique({
      where: { trackingCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("İzləmə kodu yaradıla bilmədi");
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);

  const body = await readJsonBody(request);
  if (body === null) return badRequest("Sorğu formatı düzgün deyil.");

  const parsed = OrderInputSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const input = parsed.data;

  // ── Məhsulları bazadan oxu ────────────────────────────────────────
  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, name: true, price: true, salePrice: true, stock: true, images: true },
  });

  const productById = new Map(products.map((p) => [p.id, p]));

  const missing = productIds.filter((id) => !productById.has(id));
  if (missing.length > 0) {
    return badRequest(
      "Səbətdəki məhsullardan biri artıq satışda deyil. Səbəti yeniləyib yenidən cəhd edin.",
      409
    );
  }

  // ── Stok yoxlaması (eyni məhsulun bütün sətirləri toplanır) ───────
  const neededByProduct = new Map<string, number>();
  for (const item of input.items) {
    neededByProduct.set(item.productId, (neededByProduct.get(item.productId) ?? 0) + item.quantity);
  }
  for (const [productId, needed] of neededByProduct) {
    const product = productById.get(productId)!;
    if (product.stock < needed) {
      return badRequest(
        `"${product.name}" məhsulundan stokda yalnız ${product.stock} ədəd var.`,
        409
      );
    }
  }

  // ── Məbləğlər — YALNIZ bazadakı qiymətlərlə ───────────────────────
  const lines = input.items.map((item) => {
    const product = productById.get(item.productId)!;
    const priceQepik = effectivePriceQepik(product.price, product.salePrice);

    // Müştəri hansı şəkli (variantı) seçibsə o saxlanılır. Siyahıdan kənar
    // dəyər gəlsə əsas şəklə qayıdırıq — client-in göndərdiyi indeksə
    // olduğu kimi etibar edilmir (§6).
    const imageIndex =
      item.imageIndex < product.images.length ? item.imageIndex : 0;
    const hasVariants = product.images.length > 1;

    return {
      ...item,
      productName: product.name,
      productImage: product.images[imageIndex] ?? null,
      imageIndex: hasVariants ? imageIndex : null,
      priceQepik,
    };
  });

  const subtotalQepik = lines.reduce((sum, l) => sum + l.priceQepik * l.quantity, 0);

  // ── Promokod — client-in dediyi faizə etibar edilmir ──────────────
  let promoDisplayCode: string | null = null;
  let promoNormalizedCode: string | null = null;
  let discountPct = 0;

  if (input.promoCode) {
    const normalizedCode = normalizePromo(input.promoCode);
    const promo = await prisma.promoCode.findUnique({
      where: { normalizedCode },
      select: { code: true, normalizedCode: true, discountPct: true, isActive: true },
    });

    if (!promo || !promo.isActive) {
      return badRequest("Promokod düzgün deyil və ya artıq keçərli deyil.", 400);
    }

    promoDisplayCode = promo.code;
    promoNormalizedCode = promo.normalizedCode;
    discountPct = promo.discountPct;
  }

  const discountQepik = calcDiscountQepik(subtotalQepik, discountPct);
  // Çatdırılma haqqı da serverdə hesablanır — client-in göndərdiyinə baxılmır
  const goodsQepik = subtotalQepik - discountQepik;
  const deliveryFeeQepik = calcDeliveryFeeQepik(goodsQepik);
  const totalQepik = goodsQepik + deliveryFeeQepik;

  const phone = normalizeAzPhone(input.phone)!; // sxem artıq yoxlayıb
  const createdAt = new Date();

  /**
   * Sürət limiti YALNIZ burada — bütün yoxlamalardan SONRA sayılır.
   *
   * ⚠️ Əvvəldə sayılsaydı, telefonunu bir neçə dəfə səhv yazan müştəri
   * öz limitini yandırıb sifariş verə bilməzdi. İndi yalnız həqiqi
   * sifariş cəhdləri sayılır — spam üçün əsas hədəf elə budur.
   */
  const limit = rateLimit(`order:${ip}`, MAX_ORDERS, WINDOW_MS);
  if (!limit.ok) {
    const minutes = Math.ceil(limit.retryAfterSeconds / 60);
    return badRequest(
      `Çox sayda sifariş göndərilib. ${minutes} dəqiqə sonra yenidən cəhd edin.`,
      429
    );
  }

  // ── Yazma əməliyyatı — hamısı bir tranzaksiyada ───────────────────
  const trackingCode = await uniqueTrackingCode();

  let orderNumber: string;
  let orderId: string;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const number = await nextOrderNumber(tx, createdAt);

      const order = await tx.order.create({
        data: {
          orderNumber: number,
          trackingCode,
          firstName: input.firstName,
          lastName: input.lastName,
          phone,
          email: input.email,
          city: input.city,
          address: input.address,
          note: input.note,
          promoCode: promoDisplayCode,
          discountPct,
          discountAmount: fromQepik(discountQepik),
          subtotal: fromQepik(subtotalQepik),
          deliveryFee: fromQepik(deliveryFeeQepik),
          total: fromQepik(totalQepik),
          paymentMethod: PAYMENT_METHOD,
          status: "NEW",
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              productName: line.productName,
              productImage: line.productImage,
              price: fromQepik(line.priceQepik),
              quantity: line.quantity,
              color: line.color,
              imageIndex: line.imageIndex,
              note: line.note,
            })),
          },
        },
        select: { id: true, orderNumber: true },
      });

      // Stoku şərtli azaldırıq: paralel sifarişdə stok azalıbsa `count` 0 olur
      for (const [productId, needed] of neededByProduct) {
        const updated = await tx.product.updateMany({
          where: { id: productId, stock: { gte: needed } },
          data: { stock: { decrement: needed } },
        });

        if (updated.count !== 1) {
          const product = productById.get(productId)!;
          const fresh = await tx.product.findUnique({
            where: { id: productId },
            select: { stock: true },
          });
          throw new OutOfStockError(product.name, fresh?.stock ?? 0);
        }
      }

      if (promoNormalizedCode) {
        await tx.promoCode.update({
          where: { normalizedCode: promoNormalizedCode },
          data: { usageCount: { increment: 1 } },
        });
      }

      return order;
    });

    orderNumber = result.orderNumber;
    orderId = result.id;
  } catch (error) {
    if (error instanceof OutOfStockError) {
      return badRequest(
        `"${error.productName}" məhsulundan stokda yalnız ${error.available} ədəd qaldı. ` +
          "Səbətdəki sayı azaldıb yenidən cəhd edin.",
        409
      );
    }
    console.error("[orders] Sifariş yaradıla bilmədi:", error);
    return badRequest("Sifariş yaradıla bilmədi. Bir az sonra yenidən cəhd edin.", 500);
  }

  // ── E-poçt bildirişi — sifarişi HEÇ VAXT ləğv etmir (§2.8) ────────
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const notificationEmail = process.env.ORDER_NOTIFICATION_EMAIL?.trim();

  if (notificationEmail) {
    try {
      const emailItems: OrderEmailItem[] = lines.map((line) => ({
        productName: line.productName,
        quantity: line.quantity,
        priceQepik: line.priceQepik,
        color: line.color,
        variant: line.imageIndex === null ? null : variantLabel(line.imageIndex),
        note: line.note,
      }));

      const { subject, html, text } = renderOrderEmail({
        orderNumber,
        createdAt,
        firstName: input.firstName,
        lastName: input.lastName,
        phone,
        email: input.email,
        city: input.city,
        address: input.address,
        note: input.note,
        items: emailItems,
        subtotalQepik,
        promoCode: promoDisplayCode,
        discountPct,
        discountQepik,
        deliveryFeeQepik,
        totalQepik,
        adminUrl: `${siteUrl}/admin/sifarisler/${orderId}`,
        trackingCode: formatTrackingCode(trackingCode),
        trackingUrl: `${siteUrl}/izle/${trackingCode}`,
      });

      const result = await sendMail({ to: notificationEmail, subject, html, text });
      if (!result.sent && result.mode === "error") {
        console.error(`[orders] #${orderNumber} bildirişi göndərilmədi: ${result.reason}`);
      }
    } catch (error) {
      // Buraya düşmək çətindir (sendMail exception atmır), amma sifariş qorunmalıdır
      console.error(`[orders] #${orderNumber} e-poçt xətası:`, error);
    }
  } else {
    console.warn("[orders] ORDER_NOTIFICATION_EMAIL .env-də təyin edilməyib — bildiriş göndərilmədi.");
  }

  return NextResponse.json(
    { ok: true, orderNumber, trackingCode: formatTrackingCode(trackingCode) },
    { status: 201 }
  );
}
