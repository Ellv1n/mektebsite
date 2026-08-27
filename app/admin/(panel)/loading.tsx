/** Admin panelində səhifə yüklənərkən görünən skelet. */
export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Yüklənir">
      <div>
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-100" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl border border-gray-200 bg-white" />
        ))}
      </div>

      <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white" />
      <span className="sr-only">Yüklənir…</span>
    </div>
  );
}
