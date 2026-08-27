import Link from "next/link";

/** Mağaza daxilində tapılmayan səhifə — header və footer qorunur. */
export default function ShopNotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <p className="text-5xl font-extrabold text-brand-200">404</p>
      <h1 className="mt-3 text-2xl font-bold text-gray-900">Belə məhsul tapılmadı</h1>
      <p className="mt-2 text-sm text-gray-500">
        Məhsul satışdan çıxarılmış və ya ünvan səhv yazılmış ola bilər.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/mehsullar"
          className="rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700"
        >
          Bütün məhsullar
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Ana səhifə
        </Link>
      </div>
    </main>
  );
}
