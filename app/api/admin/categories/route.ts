import { NextResponse } from "next/server";

import { badRequest, readJsonBody, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { uniqueCategorySlug } from "@/lib/unique-slug";
import { CategoryInputSchema } from "@/lib/validations/category";

/** Yeni kateqoriya yaradır (ecommerce.md §3.3). */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (body === null) return badRequest("Sorğu formatı düzgün deyil.");

  const parsed = CategoryInputSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { name, image, order } = parsed.data;

  const duplicate = await prisma.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  if (duplicate) {
    return badRequest("Bu adda kateqoriya artıq mövcuddur.", 409);
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug: await uniqueCategorySlug(name),
      image: image ?? null,
      order,
    },
  });

  return NextResponse.json({ ok: true, category }, { status: 201 });
}
