import Link from "next/link";

import { OrderSuccess } from "@/components/shop/OrderSuccess";

export const metadata = {
  title: "Sifariş qəbul edildi",
  robots: { index: false, follow: false },
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ nomre?: string; kod?: string }>;
}) {
  const { nomre, kod } = await searchParams;

  // `2026-0001` formatına uyğun olmayan dəyər qəbul edilmir
  const orderNumber = nomre && /^\d{4}-\d{4,}$/.test(nomre) ? nomre : null;
  // `K7M2-P9XQ` formatı
  const trackingCode = kod && /^[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(kod) ? kod : null;

  if (!orderNumber) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Sifariş tapılmadı</h1>
        <p className="mt-2 text-sm text-gray-500">
          Bu səhifə yalnız sifariş göndərildikdən sonra açılır.
        </p>
        <Link
          href="/mehsullar"
          className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white hover:bg-brand-700"
        >
          Məhsullara bax
        </Link>
      </main>
    );
  }

  return (
    <main className="px-4 py-10">
      <OrderSuccess orderNumber={orderNumber} trackingCode={trackingCode} />
    </main>
  );
}
