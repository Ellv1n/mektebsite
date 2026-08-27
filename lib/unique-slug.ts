import { prisma } from "./prisma";
import { slugify } from "./slug";

/**
 * Bazada təkrarlanmayan slug yaradır.
 * Redaktə zamanı `excludeId` verilir ki, məhsul öz slug-ını saxlaya bilsin.
 */

async function unique(
  base: string,
  excludeId: string | undefined,
  find: (slug: string) => Promise<{ id: string } | null>
): Promise<string> {
  let candidate = base;
  let counter = 2;

  // Praktikada bir-iki dövrədən çox olmur; yüksək hədd sonsuz dövrəyə qarşıdır
  for (let i = 0; i < 500; i++) {
    const existing = await find(candidate);
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${counter++}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export function uniqueProductSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "mehsul";
  return unique(base, excludeId, (slug) =>
    prisma.product.findUnique({ where: { slug }, select: { id: true } })
  );
}

export function uniqueCategorySlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "kateqoriya";
  return unique(base, excludeId, (slug) =>
    prisma.category.findUnique({ where: { slug }, select: { id: true } })
  );
}
