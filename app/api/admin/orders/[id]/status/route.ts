import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, readJsonBody, zodErrorResponse } from "@/lib/api";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

/**
 * Sifarişin statusunun dəyişdirilməsi (ecommerce.md §3.5).
 *
 * ⚠️ STOK BƏRPASI — spesifikasiyada yoxdur, amma zəruridir:
 * sifariş verilərkən stok azaldılır. Sifariş ləğv edilirsə həmin məhsullar
 * yenidən satışa qayıtmalıdır, əks halda mağaza olmayan defisit göstərər.
 * Ləğv edilmiş sifariş yenidən aktiv statusa qaytarılarsa stok təkrar azaldılır.
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

  return NextResponse.json({
    ok: true,
    status: nextStatus,
    label: ORDER_STATUS_LABELS[nextStatus],
    stockChanged: willBeCancelled ? "restored" : wasCancelled ? "reserved" : "none",
  });
}
