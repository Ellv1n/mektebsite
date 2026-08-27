import Link from "next/link";

/**
 * Ümumi 404 səhifəsi.
 * Bu fayl olmasa Next.js ingiliscə "404: This page could not be found."
 * göstərir — bu isə saytın tam Azərbaycan dilində olması qaydasını pozar.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-extrabold text-brand-200">404</p>
      <h1 className="mt-3 text-2xl font-bold text-gray-900">Səhifə tapılmadı</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Axtardığınız səhifə silinmiş və ya ünvanı dəyişmiş ola bilər.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700"
        >
          Ana səhifə
        </Link>
        <Link
          href="/mehsullar"
          className="rounded-xl border border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Məhsullara bax
        </Link>
      </div>
    </main>
  );
}
