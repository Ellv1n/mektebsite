/**
 * Məhsul siyahısı yüklənərkən görünən skelet (ecommerce.md §5).
 *
 * ⚠️ Bu fayl qəsdən yalnız `/mehsullar` route-undadır, `(shop)` kökündə DEYİL.
 * `loading.tsx` Suspense sərhədi yaradır və cavabın başlığını dərhal göndərir —
 * kökdə yerləşsəydi, `notFound()` çağıran məhsul detalı səhifəsi 404 əvəzinə
 * 200 statusu qaytarardı (axtarış sistemləri üçün səhvdir).
 */
export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8" aria-busy="true" aria-label="Yüklənir">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-100" />
      <div className="mt-3 h-4 w-32 animate-pulse rounded bg-gray-100" />

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <li key={index} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="aspect-square animate-pulse bg-gray-100" />
            <div className="space-y-2 p-3">
              <div className="h-4 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
              <div className="h-9 animate-pulse rounded-lg bg-gray-100" />
            </div>
          </li>
        ))}
      </ul>

      <span className="sr-only">Yüklənir…</span>
    </div>
  );
}
