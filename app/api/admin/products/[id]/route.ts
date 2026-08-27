import { NextResponse } from "next/server";

import { badRequest, readJsonBody, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { uniqueProductSlug } from "@/lib/unique-slug";
import { ProductInputSchema } from "@/lib/validations/product";

type Params = { params: Promise<{ id: string }> };

/** Məhsulu redaktə edir. */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;

  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return badRequest("Məhsul tapılmadı.", 404);

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

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      slug: await uniqueProductSlug(data.name, id),
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

  return NextResponse.json({ ok: true, product });
}

/**
 * Məhsulu silir.
 *
 * ⚠️ Sifarişdə işlədilmiş məhsul SİLİNMİR — silinsə köhnə sifarişlərin
 * məhsul əlaqəsi qırılar. Belə halda "Deaktiv et" təklif olunur:
 * deaktiv məhsul saytda görünmür, amma sifariş tarixçəsi bütöv qalır.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, _count: { select: { orderItems: true } } },
  });

  if (!product) return badRequest("Məhsul tapılmadı.", 404);

  if (product._count.orderItems > 0) {
    return badRequest(
      `"${product.name}" ${product._count.orderItems} sifarişdə işlədilib, ona görə silinə bilməz. ` +
        "Bunun əvəzinə məhsulu deaktiv edin — saytda görünməyəcək, sifariş tarixçəsi isə qalacaq.",
      409
    );
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
