import Link from "next/link";

import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES, type OrderStatusValue } from "@/lib/constants";
import { formatBakuDateTime, startOfTodayBaku } from "@/lib/date";
import { formatAzn } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "İdarə paneli" };

/** Stokda bitmiş sayılan hədd. */
const LOW_STOCK_THRESHOLD = 0;

export default async function AdminDashboardPage() {
  const todayStart = startOfTodayBaku();

  const [
    todayOrders,
    newOrders,
    totalOrders,
    salesAggregate,
    totalProducts,
    outOfStock,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.order.count(),
    // Ləğv edilmiş sifarişlər satışa daxil edilmir
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" } },
    }),
    prisma.product.count(),
    prisma.product.count({ where: { stock: { lte: LOW_STOCK_THRESHOLD } } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        firstName: true,
        lastName: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const totalSales = salesAggregate._sum.total ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">İdarə paneli</h1>
        <p className="mt-1 text-sm text-gray-500">Mağazanın ümumi vəziyyəti</p>
      </div>

      {/* Sifariş göstəriciləri */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Sifarişlər
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Bu gün" value={todayOrders} suffix="sifariş" />
          <StatCard
            label="Yeni (baxılmamış)"
            value={newOrders}
            suffix="sifariş"
            highlight={newOrders > 0}
            href="/admin/sifarisler?status=NEW"
          />
          <StatCard label="Ümumi sifariş" value={totalOrders} suffix="ədəd" />
          <StatCard label="Ümumi satış" value={formatAzn(totalSales)} />
        </div>
      </section>

      {/* Məhsul göstəriciləri */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Məhsullar
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Ümumi məhsul" value={totalProducts} suffix="ədəd" href="/admin/mehsullar" />
          <StatCard
            label="Stokda bitib"
            value={outOfStock}
            suffix="məhsul"
            highlight={outOfStock > 0}
            href="/admin/mehsullar?stok=bitib"
          />
        </div>
      </section>

      {/* Son sifarişlər */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Son sifarişlər
          </h2>
          {totalOrders > 0 && (
            <Link
              href="/admin/sifarisler"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Hamısına bax →
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-gray-700">Hələ sifariş yoxdur</p>
            <p className="mt-1 text-sm text-gray-500">
              İlk sifariş gələndə burada görünəcək.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-semibold">Nömrə</th>
                  <th className="px-4 py-3 font-semibold">Müştəri</th>
                  <th className="px-4 py-3 font-semibold">Tarix</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Məbləğ</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/sifarisler/${order.id}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {order.firstName} {order.lastName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {formatBakuDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">
                      {formatAzn(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  highlight = false,
  href,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  highlight?: boolean;
  href?: string;
}) {
  const content = (
    <div
      className={`h-full rounded-xl border bg-white p-4 transition ${
        highlight ? "border-accent-300 bg-accent-50" : "border-gray-200"
      } ${href ? "hover:border-brand-300 hover:shadow-sm" : ""}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold ${
          highlight ? "text-accent-700" : "text-gray-900"
        }`}
      >
        {value}
        {suffix && <span className="ml-1 text-sm font-normal text-gray-500">{suffix}</span>}
      </p>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

function StatusBadge({ status }: { status: OrderStatusValue }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${ORDER_STATUS_STYLES[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
