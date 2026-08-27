import { NextResponse } from "next/server";

import { badRequest, readJsonBody, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { uniqueProductSlug } from "@/lib/unique-slug";
import { ProductInputSchema } from "@/lib/validations/product";

/** Yeni məhsul yaradır (ecommerce.md §3.4). */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (body === null) return badRequest("Sorğu formatı düzgün deyil.");

  const parsed = ProductInputSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const data = parsed.data;

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
    select: { id: true },
  });
  if (!category) return badRequest("Seçilmiş kateqoriya tapılmadı.");

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: await uniqueProductSlug(data.name),
      description: data.description,
      price: data.price,
      salePrice: data.salePrice,
      images: data.images,
      colors: data.colors,
      stock: data.stock,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      categoryId: data.categoryId,
    },
    select: { id: true, slug: true, name: true },
  });

  return NextResponse.json({ ok: true, product }, { status: 201 });
}
