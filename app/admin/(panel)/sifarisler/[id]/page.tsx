import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { PrintButton } from "@/components/admin/PrintButton";
import {
  GENDER_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_METHOD_LABEL,
  STORE_INFO,
  type Gender,
} from "@/lib/constants";
import { formatBakuDateTime } from "@/lib/date";
import { formatAzn } from "@/lib/money";
import { formatAzPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { formatTrackingCode } from "@/lib/tracking-code";

export const metadata = { title: "Sifariş detalı" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { productName: "asc" } },
    },
  });

  if (!order) notFound();

  const customerName = `${order.firstName} ${order.lastName}`;

  return (
    <div className="space-y-6">
      {/* Başlıq */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/sifarisler"
            className="no-print text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            ← Sifarişlər
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">#{order.orderNumber}</h1>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                ORDER_STATUS_STYLES[order.status]
              }`}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {formatBakuDateTime(order.createdAt)} (Bakı vaxtı)
          </p>
          {/* Müştəri kodunu itirsə, operator buradan deyə bilər */}
          <p className="mt-1 text-sm text-gray-500">
            Müştərinin izləmə kodu:{" "}
            <code className="select-all rounded bg-gray-100 px-2 py-0.5 font-mono font-semibold tracking-wider text-gray-700">
              {formatTrackingCode(order.trackingCode)}
            </code>
          </p>
        </div>

        <PrintButton />
      </div>

      {/* Çap başlığı — yalnız çapda görünür */}
      <div className="hidden print:block">
        <p className="text-lg font-bold">{STORE_INFO.name} — çatdırılma qəbzi</p>
        <p className="text-sm">
          Sifariş #{order.orderNumber} · {formatBakuDateTime(order.createdAt)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Məhsullar */}
        <div className="space-y-6 lg:col-span-2">
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <h2 className="border-b border-gray-200 px-4 py-3 text-sm font-bold text-gray-900">
              Məhsullar ({order.items.length} sətir)
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-2.5 font-semibold">Məhsul</th>
                    <th className="px-4 py-2.5 text-center font-semibold">Say</th>
                    <th className="px-4 py-2.5 font-semibold">Rəng</th>
                    <th className="px-4 py-2.5 font-semibold">Kimin üçün</th>
                    <th className="px-4 py-2.5 font-semibold">Qeyd</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Məbləğ</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 align-top last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {item.productImage && (
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-gray-200 bg-white print:hidden">
                              <Image
                                src={item.productImage}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-contain p-0.5"
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{item.productName}</p>
                            <p className="text-xs text-gray-500">{formatAzn(item.price)} / ədəd</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3">
                        {item.color ? (
                          <span className="font-medium text-gray-900">{item.color}</span>
                        ) : (
                          <span className="text-gray-400">seçilməyib</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {item.gender ? GENDER_LABELS[item.gender as Gender] : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.note ? item.note : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900">
                        {formatAzn(Number(item.price) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Məbləğlər */}
            <dl className="space-y-2 border-t border-gray-200 bg-gray-50 px-4 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Ara cəmi</dt>
                <dd className="font-medium text-gray-900">{formatAzn(order.subtotal)}</dd>
              </div>
              {order.promoCode && Number(order.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-green-700">
                    Endirim ({order.promoCode}, {order.discountPct}%)
                  </dt>
                  <dd className="font-medium text-green-700">
                    −{formatAzn(order.discountAmount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-600">Çatdırılma</dt>
                <dd
                  className={
                    Number(order.deliveryFee) === 0
                      ? "font-semibold text-green-700"
                      : "font-medium text-gray-900"
                  }
                >
                  {Number(order.deliveryFee) === 0 ? "Pulsuz" : formatAzn(order.deliveryFee)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-gray-300 pt-2">
                <dt className="text-base font-bold text-gray-900">Yekun</dt>
                <dd className="text-lg font-extrabold text-gray-900">{formatAzn(order.total)}</dd>
              </div>
              <div className="flex justify-between pt-1">
                <dt className="text-gray-600">Ödəniş</dt>
                <dd className="font-semibold text-accent-700">{PAYMENT_METHOD_LABEL}</dd>
              </div>
            </dl>
          </section>

          {order.note && (
            <section className="rounded-xl border border-sun-200 bg-sun-100/50 p-4">
              <h2 className="mb-1.5 text-sm font-bold text-gray-900">Müştərinin qeydi</h2>
              <p className="whitespace-pre-line text-sm text-gray-800">{order.note}</p>
            </section>
          )}
        </div>

        {/* Müştəri və status */}
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-bold text-gray-900">Müştəri</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Ad, soyad</dt>
                <dd className="font-semibold text-gray-900">{customerName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Telefon</dt>
                <dd>
                  <a
                    href={`tel:${order.phone}`}
                    className="text-base font-semibold text-brand-600 hover:text-brand-700"
                  >
                    {formatAzPhone(order.phone)}
                  </a>
                </dd>
              </div>
              {order.email && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">E-poçt</dt>
                  <dd>
                    <a href={`mailto:${order.email}`} className="text-brand-600 hover:text-brand-700">
                      {order.email}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Şəhər / Rayon</dt>
                <dd className="text-gray-900">{order.city}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Çatdırılma ünvanı</dt>
                <dd className="whitespace-pre-line text-gray-900">{order.address}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <OrderStatusControl orderId={order.id} status={order.status} />
          </section>
        </div>
      </div>
    </div>
  );
}
