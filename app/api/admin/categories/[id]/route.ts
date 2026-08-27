import { NextResponse } from "next/server";

import { badRequest, readJsonBody, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { uniqueCategorySlug } from "@/lib/unique-slug";
import { CategoryInputSchema } from "@/lib/validations/category";

type Params = { params: Promise<{ id: string }> };

/** Kateqoriyanı redaktə edir. */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;

  const existing = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return badRequest("Kateqoriya tapılmadı.", 404);

  const body = await readJsonBody(request);
  if (body === null) return badRequest("Sorğu formatı düzgün deyil.");

  const parsed = CategoryInputSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { name, image, order } = parsed.data;

  const duplicate = await prisma.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, id: { not: id } },
    select: { id: true },
  });
  if (duplicate) {
    return badRequest("Bu adda başqa kateqoriya artıq mövcuddur.", 409);
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      name,
      slug: await uniqueCategorySlug(name, id),
      image: image ?? null,
      order,
    },
  });

  return NextResponse.json({ ok: true, category });
}

/**
 * Kateqoriyanı silir.
 * İçində məhsul varsa silinmir — istifadəçiyə say göstərilir (ecommerce.md §3.3).
 */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;

  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, name: true, _count: { select: { products: true } } },
  });

  if (!category) return badRequest("Kateqoriya tapılmadı.", 404);

  if (category._count.products > 0) {
    return badRequest(
      `"${category.name}" kateqoriyasında ${category._count.products} məhsul var. ` +
        "Əvvəlcə həmin məhsulları başqa kateqoriyaya köçürün və ya silin.",
      409
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
