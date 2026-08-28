import { NextResponse } from "next/server";

import { badRequest } from "@/lib/api";
import { type OrderStatusValue } from "@/lib/constants";
import { renderOrderStatusEmail } from "@/lib/email/order-status";
import { sendMail } from "@/lib/mail";
import { toQepik } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { formatTrackingCode } from "@/lib/tracking-code";

/**
 * Sifarişin CARİ statusu barədə məktubu müştəriyə yenidən göndərir.
 *
 * Niyə lazımdır: status məktubu avtomatik gedir, amma SMTP xətası, Gmail
 * sürət limiti və ya səhvən dəyişdirilmiş status kimi hallarda admin məktubu
 * əl ilə təkrar göndərə bilməlidir — statusu yenidən "dəyişmək" məcburiyyəti
 * olmadan (eyni statusa keçid heç nə etmir).
 */

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      orderNumber: true,
      status: true,
      firstName: true,
      email: true,
      total: true,
      trackingCode: true,
    },
  });

  if (!order) return badRequest("Sifariş tapılmadı.", 404);

  if (!order.email) {
    return badRequest("Bu sifarişdə müştərinin e-poçt ünvanı yoxdur.", 409);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

  const { subject, html, text } = renderOrderStatusEmail({
    orderNumber: order.orderNumber,
    firstName: order.firstName,
    status: order.status as OrderStatusValue,
    totalQepik: toQepik(order.total),
    trackingCode: formatTrackingCode(order.trackingCode),
    trackingUrl: `${siteUrl}/izle/${order.trackingCode}`,
  });

  const result = await sendMail({ to: order.email, subject, html, text });

  console.log(
    `[admin/orders] #${order.orderNumber} status məktubu ƏL İLƏ ${order.email} ünvanına — ` +
      `${result.sent ? "göndərildi" : `göndərilmədi (${result.mode})`}`
  );

  if (!result.sent) {
    return badRequest(
      result.mode === "console"
        ? "SMTP qurulmayıb — məktub göndərilmədi (məzmun server logundadır)."
        : `Məktub göndərilmədi: ${result.reason}`,
      502
    );
  }

  return NextResponse.json({ ok: true, email: order.email });
}
