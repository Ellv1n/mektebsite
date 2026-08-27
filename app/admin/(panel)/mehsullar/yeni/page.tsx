import Link from "next/link";

import { ProductForm } from "@/components/admin/ProductForm";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Yeni məhsul" };

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/mehsullar"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Məhsullar
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Yeni məhsul</h1>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-700">Əvvəlcə kateqoriya yaradın</p>
          <p className="mt-1 text-sm text-gray-500">
            Məhsul əlavə etmək üçün ən azı bir kateqoriya olmalıdır.
          </p>
          <Link
            href="/admin/kateqoriyalar"
            className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Kateqoriyalara keç
          </Link>
        </div>
      ) : (
        <ProductForm categories={categories} />
      )}
    </div>
  );
}
