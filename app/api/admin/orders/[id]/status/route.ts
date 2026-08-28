import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, readJsonBody, zodErrorResponse } from "@/lib/api";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";
import { renderOrderStatusEmail } from "@/lib/email/order-status";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { toQepik } from "@/lib/money";
import { formatTrackingCode } from "@/lib/tracking-code";

/**
 * Sifarişin statusunun dəyişdirilməsi (ecommerce.md §3.5).
 *
 * ⚠️ STOK BƏRPASI — spesifikasiyada yoxdur, amma zəruridir:
 * sifariş verilərkən stok azaldılır. Sifariş ləğv edilirsə həmin məhsullar
 * yenidən satışa qayıtmalıdır, əks halda mağaza olmayan defisit göstərər.
 * Ləğv edilmiş sifariş yenidən aktiv statusa qaytarılarsa stok təkrar azaldılır.
 *
 * Status dəyişdikdən sonra müştəriyə məlumat məktubu gedir (e-poçt ünvanı
 * veribsə). Məktub uğursuz olsa da status dəyişikliyi qüvvədə qalır —
 * cavabda `emailSent` sahəsi ilə admin panelə bildirilir.
 */

const Schema = z.object({
  status: z.enum(ORDER_STATUSES, {
    errorMap: () => ({ message: "Naməlum status" }),
  }),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;

  const body = await readJsonBody(request);
  if (body === null) return badRequest("Sorğu formatı düzgün deyil.");

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const nextStatus = parsed.data.status;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      firstName: true,
      email: true,
      total: true,
      trackingCode: true,
      items: { select: { productId: true, quantity: true, productName: true } },
    },
  });

  if (!order) return badRequest("Sifariş tapılmadı.", 404);

  if (order.status === nextStatus) {
    return NextResponse.json({ ok: true, status: nextStatus, stockChanged: "none" });
  }

  const wasCancelled = order.status === "CANCELLED";
  const willBeCancelled = nextStatus === "CANCELLED";

  // Eyni məhsulun bütün sətirləri toplanır
  const byProduct = new Map<string, { quantity: number; name: string }>();
  for (const item of order.items) {
    const current = byProduct.get(item.productId);
    byProduct.set(item.productId, {
      quantity: (current?.quantity ?? 0) + item.quantity,
      name: item.productName,
    });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Ləğv edilir → stok geri qaytarılır
      if (willBeCancelled && !wasCancelled) {
        for (const [productId, { quantity }] of byProduct) {
          await tx.product.updateMany({
            where: { id: productId },
            data: { stock: { increment: quantity } },
          });
        }
      }

      // Ləğvdən çıxarılır → stok yenidən tutulur
      if (wasCancelled && !willBeCancelled) {
        for (const [productId, { quantity, name }] of byProduct) {
          const updated = await tx.product.updateMany({
            where: { id: productId, stock: { gte: quantity } },
            data: { stock: { decrement: quantity } },
          });
          if (updated.count !== 1) {
            throw new Error(`STOCK:${name}`);
          }
        }
      }

      await tx.order.update({ where: { id }, data: { status: nextStatus } });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("STOCK:")) {
      return badRequest(
        `"${message.slice(6)}" məhsulundan stokda kifayət qədər yoxdur — ` +
          "sifarişi bərpa etmək üçün əvvəlcə stoku artırın.",
        409
      );
    }
    console.error("[admin/orders] Status dəyişdirilə bilmədi:", error);
    return badRequest("Status dəyişdirilə bilmədi.", 500);
  }

  // ── Müştəriyə status məktubu ─────────────────────────────────────
  // Status artıq bazada dəyişib: buradakı heç bir xəta əməliyyatı geri almır.
  let emailSent: boolean | null = null;

  if (order.email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
    try {
      const { subject, html, text } = renderOrderStatusEmail({
        orderNumber: order.orderNumber,
        firstName: order.firstName,
        status: nextStatus,
        totalQepik: toQepik(order.total),
        trackingCode: formatTrackingCode(order.trackingCode),
        trackingUrl: `${siteUrl}/izle/${order.trackingCode}`,
      });

      const result = await sendMail({ to: order.email, subject, html, text });
      emailSent = result.sent;
      console.log(
        `[admin/orders] #${order.orderNumber} → ${nextStatus}: status məktubu ` +
          `${order.email} ünvanına — ${result.sent ? "göndərildi" : `göndərilmədi (${result.mode})`}`
      );
      if (!result.sent && result.mode === "error") {
        console.error(
          `[admin/orders] #${order.orderNumber} status məktubu göndərilmədi: ${result.reason}`
        );
      }
    } catch (error) {
      emailSent = false;
      console.error(`[admin/orders] #${order.orderNumber} status məktubu xətası:`, error);
    }
  } else {
    // Səbəbin log-da görünməsi vacibdir: "məktub gəlmir" şikayətinin ən tez-tez
    // rast gəlinən səbəbi sifarişdə ünvanın olmamasıdır (köhnə sifarişlər).
    console.warn(
      `[admin/orders] #${order.orderNumber}: sifarişdə e-poçt ünvanı yoxdur — status məktubu göndərilmədi.`
    );
  }

  return NextResponse.json({
    ok: true,
    status: nextStatus,
    label: ORDER_STATUS_LABELS[nextStatus],
    stockChanged: willBeCancelled ? "restored" : wasCancelled ? "reserved" : "none",
    /** null = müştəri e-poçt ünvanı verməyib */
    emailSent,
  });
}
