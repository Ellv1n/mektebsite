import { CategoryManager } from "@/components/admin/CategoryManager";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Kateqoriyalar" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      order: true,
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kateqoriyalar</h1>
        <p className="mt-1 text-sm text-gray-500">
          Saytdakı kateqoriyaları əlavə edin, adını və sırasını dəyişin.
        </p>
      </div>

      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          image: c.image,
          order: c.order,
          productCount: c._count.products,
        }))}
      />
    </div>
  );
}
