import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, readJsonBody, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isPromoShapeValid, normalizePromo } from "@/lib/promo";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Promokodun yoxlanması (ecommerce.md §2.6).
 *
 * ⚠️ Bu route yalnız MÜŞTƏRİYƏ GÖSTƏRMƏK üçündür.
 * Sifariş yaradılarkən kod və endirim serverdə YENİDƏN yoxlanılır —
 * buradan qayıdan faizə etibar edilmir (§6).
 */

const Schema = z.object({
  code: z.string().trim().min(1, "Promokodu daxil edin").max(32, "Promokod çox uzundur"),
});

// Kodların kobud üsulla tapılmasının qarşısını almaq üçün: dəqiqədə 20 sorğu
const MAX_ATTEMPTS = 20;
const WINDOW_MS = 60 * 1000;

const INVALID_MESSAGE = "Promokod düzgün deyil";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limit = rateLimit(`promo:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!limit.ok) {
    return badRequest("Çox sayda cəhd. Bir az sonra yenidən yoxlayın.", 429);
  }

  const body = await readJsonBody(request);
  if (body === null) return badRequest("Sorğu formatı düzgün deyil.");

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (!isPromoShapeValid(parsed.data.code)) {
    return badRequest(INVALID_MESSAGE, 404);
  }

  // TABİB2026 / TABIB2026 / tabib2026 — hamısı eyni normalizə formasına düşür
  const normalizedCode = normalizePromo(parsed.data.code);

  const promo = await prisma.promoCode.findUnique({
    where: { normalizedCode },
    select: { code: true, discountPct: true, isActive: true },
  });

  if (!promo) {
    return badRequest(INVALID_MESSAGE, 404);
  }

  if (!promo.isActive) {
    return badRequest("Bu promokod artıq keçərli deyil", 410);
  }

  return NextResponse.json({
    ok: true,
    code: promo.code,
    discountPct: promo.discountPct,
  });
}
