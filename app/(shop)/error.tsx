"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Mağaza tərəfində gözlənilməz xəta (ecommerce.md §5 — mesajlar AZ dilində). */
export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[shop] Səhifə xətası:", error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
        ⚠
      </div>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Nəsə səhv getdi</h1>
      <p className="mt-2 text-sm text-gray-500">
        Səhifəni yükləmək mümkün olmadı. Bir az sonra yenidən cəhd edin.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700"
        >
          Yenidən cəhd et
        </button>
        <Link
          href="/"
          className="rounded-xl border border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Ana səhifə
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 text-xs text-gray-400">Xəta kodu: {error.digest}</p>
      )}
    </main>
  );
}
