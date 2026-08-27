import Link from "next/link";
import { redirect } from "next/navigation";

import { normalizeTrackingCode } from "@/lib/tracking-code";

export const metadata = {
  title: "Sifarişi izlə",
  description: "İzləmə kodu ilə sifarişinizin hansı mərhələdə olduğunu görün.",
};

/**
 * İzləmə kodunu daxil etmə səhifəsi.
 * Forma adi GET ilə işləyir — JavaScript söndürülsə də açılır.
 */
export default async function TrackFormPage({
  searchParams,
}: {
  searchParams: Promise<{ kod?: string }>;
}) {
  const { kod } = await searchParams;

  // Kod yazılıbsa birbaşa sifariş səhifəsinə keçirik
  if (kod !== undefined) {
    const normalized = normalizeTrackingCode(kod);
    if (normalized) redirect(`/izle/${normalized}`);
  }

  const invalid = kod !== undefined && kod.trim() !== "";

  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <nav className="mb-3 text-sm text-gray-500" aria-label="Naviqasiya">
        <Link href="/" className="hover:text-brand-700">
          Ana səhifə
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">Sifarişi izlə</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">Sifarişi izlə</h1>
      <p className="mt-2 text-sm text-gray-500">
        Sifariş verdikdən sonra sizə verilən izləmə kodunu daxil edin.
      </p>

      <form method="GET" className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <label htmlFor="kod" className="mb-1.5 block text-sm font-medium text-gray-700">
          İzləmə kodu
        </label>
        <input
          id="kod"
          name="kod"
          type="text"
          defaultValue={kod ?? ""}
          autoFocus
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="K7M2-P9XQ"
          maxLength={20}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-mono text-xl uppercase tracking-[0.2em] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />

        {invalid && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            Kod düzgün deyil. 8 simvoldan ibarət olmalıdır, məsələn: K7M2-P9XQ
          </p>
        )}

        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-brand-600 px-6 py-3 text-base font-bold text-white transition hover:bg-brand-700"
        >
          Sifarişi tap
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-800">Kodu tapa bilmirsiniz?</p>
        <p className="mt-1">
          Kod sifariş verdikdən sonra təşəkkür səhifəsində göstərilir. Kodu itirmisinizsə
          bizimlə telefonla əlaqə saxlayın — sifarişinizi adınız və nömrənizlə tapacağıq.
        </p>
      </div>
    </main>
  );
}
