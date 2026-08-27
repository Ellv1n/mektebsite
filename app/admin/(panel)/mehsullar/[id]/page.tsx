import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/ProductForm";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Məhsulun redaktəsi" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        categoryId: true,
        price: true,
        salePrice: true,
        description: true,
        colors: true,
        images: true,
        stock: true,
        isActive: true,
        isFeatured: true,
        _count: { select: { orderItems: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/mehsullar"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Məhsullar
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{product.name}</h1>
        {product._count.orderItems > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            Bu məhsul {product._count.orderItems} sifarişdə işlədilib — silinə bilməz, yalnız
            deaktiv edilə bilər.
          </p>
        )}
      </div>

      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          name: product.name,
          categoryId: product.categoryId,
          // Decimal → forma üçün mətn ("12.50")
          price: product.price.toString(),
          salePrice: product.salePrice ? product.salePrice.toString() : "",
          description: product.description ?? "",
          colorsText: product.colors.join(", "),
          images: product.images,
          stock: String(product.stock),
          isActive: product.isActive,
          isFeatured: product.isFeatured,
        }}
      />
    </div>
  );
}
