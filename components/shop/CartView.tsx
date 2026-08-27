"use client";

import Link from "next/link";

import { CartItemRow } from "./CartItemRow";
import { CartSummary } from "./CartSummary";
import { useCart } from "./CartProvider";

/** Səbət səhifəsinin məzmunu (ecommerce.md §2.5). */
export function CartView() {
  const { items, count, ready, clear } = useCart();

  // Səbət localStorage-dədir — server render zamanı məzmun məlum deyil
  if (!ready) {
    return (
      <div className="mt-8 space-y-3" aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <p className="text-base font-medium text-gray-700">Səbətiniz boşdur</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
          Bəyəndiyiniz məhsulları səbətə əlavə edin — rəngini və kimin üçün olduğunu özünüz
          seçəcəksiniz.
        </p>
        <Link
          href="/mehsullar"
          className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700"
        >
          Alış-verişə başla
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {items.length} sətir · {count} ədəd
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirm("Səbət tamamilə təmizlənsin?")) clear();
            }}
            className="text-sm font-medium text-gray-500 transition hover:text-red-600"
          >
            Səbəti təmizlə
          </button>
        </div>

        <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
          {items.map((item) => (
            <CartItemRow key={item.key} item={item} />
          ))}
        </ul>

        <p className="mt-3 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
          Eyni məhsulu fərqli rəngdə istəyirsinizsə, məhsul səhifəsindən yenidən əlavə edin —
          səbətdə ayrı sətir kimi görünəcək.
        </p>
      </div>

      <CartSummary />
    </div>
  );
}
