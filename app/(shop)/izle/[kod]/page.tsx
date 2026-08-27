import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";

import { OrderTimeline } from "@/components/shop/OrderTimeline";
import { variantLabel } from "@/lib/cart";
import { GENDER_LABELS, PAYMENT_METHOD_LABEL, type Gender } from "@/lib/constants";
import { formatBakuDateTime } from "@/lib/date";
import { formatAzn } from "@/lib/money";
import { formatAzPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { formatTrackingCode, normalizeTrackingCode } from "@/lib/tracking-code";

export const metadata = {
  title: "Sifarişiniz",
  robots: { index: false, follow: false },
};

// Kodun kobud üsulla tapılmasının qarşısını almaq üçün: dəqiqədə 30 sorğu
const MAX_LOOKUPS = 30;
const WINDOW_MS = 60 * 1000;

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ kod: string }>;
}) {
  const { kod } = await params;

  const requestHeaders = await headers();
  const limit = rateLimit(`track:${getClientIp(requestHeaders)}`, MAX_LOOKUPS, WINDOW_MS);
  if (!limit.ok) {
    return (
      <Message
        title="Çox sayda cəhd"
        text="Bir dəqiqə gözləyib yenidən yoxlayın."
      />
    );
  }

  const normalized = normalizeTrackingCode(decodeURIComponent(kod));
  if (!normalized) {
    return (
      <Message
        title="Kod düzgün deyil"
        text="İzləmə kodu 8 simvoldan ibarətdir, məsələn: K7M2-P9XQ"
      />
    );
  }

  const order = await prisma.order.findUnique({
    where: { trackingCode: normalized },
    include: { items: { orderBy: { productName: "asc" } } },
  });

  if (!order) {
    return (
      <Message
        title="Sifariş tapılmadı"
        text="Bu kodla sifariş yoxdur. Kodu yenidən yoxlayın — böyük/kiçik hərfin fərqi yoxdur."
      />
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <nav className="mb-3 text-sm text-gray-500" aria-label="Naviqasiya">
        <Link href="/" className="hover:text-brand-700">
          Ana səhifə
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">Sifariş #{order.orderNumber}</span>
      </nav>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Sifariş #{order.orderNumber}
        </h1>
        <p className="text-sm text-gray-500">{formatBakuDateTime(order.createdAt)}</p>
      </div>

      {/* Mərhələ zolağı */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <OrderTimeline status={order.status} />
      </section>

      {/* Məhsullar */}
      <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <h2 className="border-b border-gray-200 px-4 py-3 text-sm font-bold text-gray-900">
          Sifarişinizdəki məhsullar
        </h2>

        <ul className="divide-y divide-gray-100">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3 p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-[9px] text-gray-300">
                    şəkil yox
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-500">
                  <li>
                    <span className="text-gray-400">Rəng:</span>{" "}
                    {item.color ?? "seçilməyib"}
                  </li>
                  {item.imageIndex !== null && (
                    <li>
                      <span className="text-gray-400">Variant:</span>{" "}
                      {variantLabel(item.imageIndex)}
                    </li>
                  )}
                  {/* KÖHNƏ sifarişlərdə qalan seçim */}
                  {item.gender && (
                    <li>
                      <span className="text-gray-400">Kimin üçün:</span>{" "}
                      {GENDER_LABELS[item.gender as Gender]}
                    </li>
                  )}
                </ul>
                {item.note && (
                  <p className="mt-0.5 text-sm text-gray-500">
                    <span className="text-gray-400">Qeyd:</span> {item.note}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="font-semibold text-gray-900">
                  {formatAzn(Number(item.price) * item.quantity)}
                </p>
                <p className="text-sm text-gray-500">{item.quantity} ədəd</p>
              </div>
            </li>
          ))}
        </ul>

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
              <dd className="font-medium text-green-700">−{formatAzn(order.discountAmount)}</dd>
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

      {/* Çatdırılma */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-gray-900">Çatdırılma məlumatları</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-gray-400">Ad, soyad</dt>
            <dd className="text-gray-900">
              {order.firstName} {order.lastName}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-gray-400">Telefon</dt>
            <dd className="text-gray-900">{formatAzPhone(order.phone)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-gray-400">Ünvan</dt>
            <dd className="text-gray-900">
              {order.city}, {order.address}
            </dd>
          </div>
          {order.note && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-gray-400">Qeydiniz</dt>
              <dd className="text-gray-900">{order.note}</dd>
            </div>
          )}
        </dl>
      </section>

      <p className="mt-6 text-center text-sm text-gray-500">
        İzləmə kodunuz:{" "}
        <code className="select-all rounded bg-gray-100 px-2 py-1 font-mono font-semibold text-gray-700">
          {formatTrackingCode(order.trackingCode)}
        </code>
      </p>

      <div className="mt-4 text-center">
        <Link
          href="/mehsullar"
          className="inline-block rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Alış-verişə davam et
        </Link>
      </div>
    </main>
  );
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">{text}</p>
      <Link
        href="/izle"
        className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700"
      >
        Kodu yenidən yaz
      </Link>
    </main>
  );
}
