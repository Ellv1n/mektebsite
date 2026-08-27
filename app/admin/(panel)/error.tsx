"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Admin panelində gözlənilməz xəta. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] Səhifə xətası:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
        ⚠
      </div>
      <h1 className="mt-4 text-xl font-bold text-gray-900">Səhifə açıla bilmədi</h1>
      <p className="mt-2 text-sm text-gray-500">
        Verilənlər bazası ilə əlaqə kəsilmiş ola bilər. Docker konteynerinin işlədiyini
        yoxlayın: <code className="rounded bg-gray-100 px-1.5 py-0.5">docker compose ps</code>
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Yenidən cəhd et
        </button>
        <Link
          href="/admin"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          İdarə panelinə qayıt
        </Link>
      </div>

      {error.digest && <p className="mt-6 text-xs text-gray-400">Xəta kodu: {error.digest}</p>}
    </div>
  );
}
