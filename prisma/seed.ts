/**
 * Seed skripti — bazanı başlanğıc məlumatla doldurur.
 *
 * İşə salmaq:  npx prisma db seed
 *
 * Nə yazır:
 *   1. 18 kateqoriya (ecommerce.md §1)
 *   2. 2 promokod: RTH2026 və TABİB2026 — hər ikisi 10% endirim
 *   3. 1 admin hesabı (istifadəçi adı/şifrə .env-dən)
 *   4. Məhsullar — `sederek/product-catalog.json` faylı varsa oradan.
 *      Fayl yoxdursa məhsul mərhələsi atlanır (2-ci addımda yaradılacaq).
 *
 * Skript idempotentdir: təkrar işlədilə bilər, dublikat yaratmır.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

import { SEED_CATEGORIES } from "../lib/constants";
import { normalizePromo } from "../lib/promo";
import { slugify } from "../lib/slug";

const prisma = new PrismaClient();

/**
 * product-catalog.json faylındakı bir məhsulun forması.
 * Bu faylı `npm run catalog` yaradır (scripts/build-catalog.ts).
 */
type CatalogEntry = {
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  colors?: string[];
  price: number;
  salePrice?: number | null;
  stock?: number;
  isFeatured?: boolean;
  genderHint?: string | null;
  /** Hazır şəkil yolları, məs. ["/uploads/products/plastilin-12-reng.jpg"] */
  images?: string[];
  sourceFiles?: string[];
  confidence?: "high" | "medium" | "low";
};

const CATALOG_PATH = path.join(process.cwd(), "sederek", "product-catalog.json");

async function seedCategories() {
  console.log("→ Kateqoriyalar yazılır...");
  for (let i = 0; i < SEED_CATEGORIES.length; i++) {
    const name = SEED_CATEGORIES[i];
    const slug = slugify(name);
    await prisma.category.upsert({
      where: { slug },
      update: { name, order: i },
      create: { name, slug, order: i },
    });
  }
  console.log(`  ✓ ${SEED_CATEGORIES.length} kateqoriya hazırdır`);
}

async function seedPromoCodes() {
  console.log("→ Promokodlar yazılır...");
  // `code` göstəriş forması, `normalizedCode` müqayisə formasıdır.
  // TABİB2026 (nöqtəli İ) → TABIB2026 kimi normalizə olunur, beləliklə
  // müştəri hansı variantı yazırsa yazsın kod tapılır (ecommerce.md §2.6).
  const codes = [
    { code: "RTH2026", discountPct: 10 },
    { code: "TABİB2026", discountPct: 10 },
  ];

  for (const c of codes) {
    const normalizedCode = normalizePromo(c.code);
    await prisma.promoCode.upsert({
      where: { normalizedCode },
      update: { code: c.code, discountPct: c.discountPct, isActive: true },
      create: {
        code: c.code,
        normalizedCode,
        discountPct: c.discountPct,
        isActive: true,
      },
    });
    console.log(`  ✓ ${c.code} (müqayisə: ${normalizedCode}) — ${c.discountPct}%`);
  }
}

async function seedAdmin() {
  console.log("→ Admin hesabı yazılır...");
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "ADMIN_USERNAME və ADMIN_PASSWORD .env faylında təyin edilməyib. " +
        ".env.example faylına bax."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.admin.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });
  console.log(`  ✓ Admin: ${username}`);
}

async function seedProducts() {
  if (!fs.existsSync(CATALOG_PATH)) {
    console.log("→ Məhsullar atlanır — sederek/product-catalog.json hələ yoxdur.");
    console.log("  (Şəkil kataloqu 2-ci addımda yaradılacaq.)");
    return;
  }

  console.log("→ Məhsullar yazılır...");
  const raw = fs.readFileSync(CATALOG_PATH, "utf8");
  const entries: CatalogEntry[] = JSON.parse(raw);

  // Kateqoriya adı → id xəritəsi
  const categories = await prisma.category.findMany();
  const byName = new Map(categories.map((c) => [c.name, c.id]));
  const digerId = byName.get("Digər");

  let written = 0;
  let skipped = 0;
  let totalImages = 0;

  for (const e of entries) {
    const categoryId = byName.get(e.category) ?? digerId;
    if (!categoryId) {
      console.warn(`  ! "${e.name}" — kateqoriya tapılmadı: ${e.category}`);
      skipped++;
      continue;
    }

    const images = e.images ?? [];
    totalImages += images.length;

    const data = {
      name: e.name,
      description: e.description ?? null,
      price: e.price,
      salePrice: e.salePrice ?? null,
      images,
      colors: e.colors ?? [],
      stock: e.stock ?? 0,
      isFeatured: e.isFeatured ?? false,
      categoryId,
    };

    await prisma.product.upsert({
      where: { slug: e.slug },
      update: data,
      create: { ...data, slug: e.slug, isActive: true },
    });
    written++;
  }

  console.log(`  ✓ ${written} məhsul, ${totalImages} şəkil yazıldı${skipped ? `, ${skipped} atlandı` : ""}`);
}

async function main() {
  console.log("\n═══ Məktəbli Səbəti — baza doldurulur ═══\n");
  await seedCategories();
  await seedPromoCodes();
  await seedAdmin();
  await seedProducts();
  console.log("\n✓ Hazırdır.\n");
}

main()
  .catch((e) => {
    console.error("\n✗ Seed xətası:\n", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
