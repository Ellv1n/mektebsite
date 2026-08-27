import type { Prisma } from "@prisma/client";

import { currentYearBaku } from "./date";

/**
 * Sifariş nömrəsi: `2026-0001` (ecommerce.md §4).
 *
 * ⚠️ `SELECT max(orderNumber)` İŞLƏTMƏ. Eyni anda iki sifariş gəlsə,
 * hər ikisi eyni nömrəni oxuyar və unikal indeks xətası verər.
 *
 * Burada `OrderCounter` cədvəli üzərində atomik `INSERT ... ON CONFLICT
 * DO UPDATE ... RETURNING` işlədilir — Postgres sətri kilidləyir, ona görə
 * paralel sorğular ardıcıl nömrə alır.
 *
 * Mütləq tranzaksiya daxilində çağırılmalıdır.
 */
export async function nextOrderNumber(
  tx: Prisma.TransactionClient,
  now: Date = new Date()
): Promise<string> {
  const year = currentYearBaku(now);

  const rows = await tx.$queryRaw<{ value: number }[]>`
    INSERT INTO "OrderCounter" ("year", "value")
    VALUES (${year}, 1)
    ON CONFLICT ("year") DO UPDATE SET "value" = "OrderCounter"."value" + 1
    RETURNING "value"
  `;

  const value = rows[0]?.value ?? 1;
  return `${year}-${String(value).padStart(4, "0")}`;
}
