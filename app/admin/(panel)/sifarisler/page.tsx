import type { Prisma } from "@prisma/client";
import Link from "next/link";

import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  type OrderStatusValue,
} from "@/lib/constants";
import { formatBakuDateTime } from "@/lib/date";
import { formatAzn } from "@/lib/money";
import { formatAzPhone, normalizeAzPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Sifarişlər" };

const PER_PAGE = 25;

type SearchParams = {
  q?: string;
  status?: string;
  tarixdan?: string;
  tarixe?: string;
  sehife?: string;
};

/** `2026-08-26` → həmin günün başlanğıcı (Bakı vaxtı, UTC+4). */
function parseDateFrom(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000+04:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `2026-08-26` → həmin günün sonu (daxil olmaqla). */
function parseDateTo(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T23:59:59.999+04:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const status = ORDER_STATUSES.includes(params.status as OrderStatusValue)
    ? (params.status as OrderStatusValue)
    : "";
  const dateFrom = parseDateFrom(params.tarixdan);
  const dateTo = parseDateTo(params.tarixe);
  const page = Math.max(1, Number(params.sehife) || 1);

  // Axtarış: ad, soyad, telefon və ya sifariş nömrəsi üzrə.
  // Telefon yazılıbsa normalizə edilmiş forma da yoxlanılır (+994...).
  const normalizedPhone = query ? normalizeAzPhone(query) : null;
  const queryDigits = query.replace(/\D/g, "");
  // Tam nömrə yazılıbsa normalizə edilmiş forma, yoxsa yalnız rəqəmlər axtarılır
  const phoneNeedle = normalizedPhone ?? (queryDigits !== "" ? queryDigits : query);

  const searchFilter: Prisma.OrderWhereInput | undefined = query
    ? {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { orderNumber: { contains: query, mode: "insensitive" } },
          { phone: { contains: phoneNeedle } },
        ],
      }
    : undefined;

  const where: Prisma.OrderWhereInput = {
    ...(searchFilter ?? {}),
    ...(status ? { status } : {}),
    ...(dateFrom || dateTo
      ? { createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
      : {}),
  };

  const [total, newCount, orders, statusCounts] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        orderNumber: true,
        firstName: true,
        lastName: true,
        phone: true,
        total: true,
        status: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countByStatus = new Map(statusCounts.map((s) => [s.status, s._count._all]));
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  function pageHref(target: number) {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (status) sp.set("status", status);
    if (params.tarixdan) sp.set("tarixdan", params.tarixdan);
    if (params.tarixe) sp.set("tarixe", params.tarixe);
    if (target > 1) sp.set("sehife", String(target));
    const qs = sp.toString();
    return qs ? `/admin/sifarisler?${qs}` : "/admin/sifarisler";
  }

  const hasFilter = Boolean(query || status || dateFrom || dateTo);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sifarişlər</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} sifariş{hasFilter ? " (filtrlə)" : ""}
            {newCount > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-accent-700">{newCount} baxılmamış</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Status qısayolları */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/sifarisler"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition ${
            status === "" ? "bg-gray-900 text-white ring-gray-900" : "bg-white text-gray-600 ring-gray-300 hover:bg-gray-50"
          }`}
        >
          Hamısı
        </Link>
        {ORDER_STATUSES.map((value) => (
          <Link
            key={value}
            href={`/admin/sifarisler?status=${value}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition ${
              status === value
                ? ORDER_STATUS_STYLES[value]
                : "bg-white text-gray-600 ring-gray-300 hover:bg-gray-50"
            }`}
          >
            {ORDER_STATUS_LABELS[value]}
            <span className="ml-1.5 text-xs opacity-70">{countByStatus.get(value) ?? 0}</span>
          </Link>
        ))}
      </div>

      {/* Axtarış və tarix filtri */}
      <form
        method="GET"
        className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-[1fr_auto_auto_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Ad, soyad, telefon və ya sifariş nömrəsi…"
          className="rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        <input
          type="date"
          name="tarixdan"
          defaultValue={params.tarixdan ?? ""}
          aria-label="Tarixdən"
          className="rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-brand-500"
        />
        <input
          type="date"
          name="tarixe"
          defaultValue={params.tarixe ?? ""}
          aria-label="Tarixə qədər"
          className="rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Axtar
        </button>
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-medium text-gray-700">
            {hasFilter ? "Uyğun sifariş tapılmadı" : "Hələ sifariş yoxdur"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {hasFilter
              ? "Filtrləri dəyişməyə cəhd edin."
              : "İlk sifariş gələndə burada görünəcək."}
          </p>
          {hasFilter && (
            <Link
              href="/admin/sifarisler"
              className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Filtrləri sıfırla
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-semibold">Nömrə</th>
                <th className="px-4 py-3 font-semibold">Müştəri</th>
                <th className="px-4 py-3 font-semibold">Telefon</th>
                <th className="px-4 py-3 font-semibold">Tarix</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Məbləğ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const isNew = order.status === "NEW";
                return (
                  <tr
                    key={order.id}
                    className={`border-b border-gray-100 last:border-0 ${
                      isNew ? "bg-accent-50/60 hover:bg-accent-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/admin/sifarisler/${order.id}`}
                        className="font-semibold text-brand-600 hover:text-brand-700"
                      >
                        #{order.orderNumber}
                      </Link>
                      {isNew && (
                        <span className="ml-2 rounded bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Yeni
                        </span>
                      )}
                      <span className="ml-2 text-xs text-gray-400">
                        {order._count.items} sətir
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {order.firstName} {order.lastName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <a href={`tel:${order.phone}`} className="text-brand-600 hover:text-brand-700">
                        {formatAzPhone(order.phone)}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {formatBakuDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          ORDER_STATUS_STYLES[order.status]
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900">
                      {formatAzn(order.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <nav className="flex items-center justify-between" aria-label="Səhifələmə">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Əvvəlki
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-gray-500">
            Səhifə {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Link
              href={pageHref(page + 1)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Növbəti →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
