"use client";

/** Kuryer üçün sadə çek çapı (ecommerce.md §3.5). */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
    >
      Çap et
    </button>
  );
}
