/**
 * Hələ qurulmamış admin bölmələri üçün müvəqqəti görünüş.
 * Hər bölmə hazır olduqca bu komponent həmin səhifədən silinir.
 */
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-gray-700">Bu bölmə hazırlanır</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}
