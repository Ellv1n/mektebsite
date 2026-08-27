/**
 * Şəkil kataloqunu qurur.
 * İşə salmaq:  npm run catalog
 *
 * Nə edir:
 *   1. sederek/catalog-raw.jsonl faylını oxuyur
 *   2. Hər `sourceFile` dəyərinin diskdə HƏQİQƏTƏN olduğunu yoxlayır
 *   3. Heç bir şəklin kataloqdan kənarda qalmadığını yoxlayır
 *   4. `duplicateOf` sətirlərini əsas məhsulun ƏLAVƏ ŞƏKLİ kimi birləşdirir
 *   5. Şəkilləri public/uploads/products/ qovluğuna slug adı ilə kopyalayır
 *   6. sederek/product-catalog.json faylını yazır (seed bunu oxuyur)
 *
 * Mənbə qovluğu (sederek/sederekphoto) DƏYİŞDİRİLMİR — yalnız oxunur.
 */

import fs from "node:fs";
import path from "node:path";

import { SEED_CATEGORIES } from "../lib/constants";

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "sederek", "sederekphoto");
const RAW_PATH = path.join(ROOT, "sederek", "catalog-raw.jsonl");
const OUT_PATH = path.join(ROOT, "sederek", "product-catalog.json");
const TARGET_DIR = path.join(ROOT, "public", "uploads", "products");

type RawEntry = {
  sourceFile: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  colors: string[];
  price: number;
  salePrice: number | null;
  stock: number;
  isFeatured: boolean;
  genderHint: string | null;
  targetFile: string | null;
  duplicateOf: string | null;
  confidence: "high" | "medium" | "low";
};

type Product = {
  name: string;
  slug: string;
  category: string;
  description: string | null;
  colors: string[];
  price: number;
  salePrice: number | null;
  stock: number;
  isFeatured: boolean;
  genderHint: string | null;
  images: string[];
  sourceFiles: string[];
  confidence: "high" | "medium" | "low";
};

const problems: string[] = [];

function fail(msg: string): never {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

// ── 1. Xam kataloqu oxu ────────────────────────────────────────────
if (!fs.existsSync(RAW_PATH)) fail(`Fayl tapılmadı: ${RAW_PATH}`);

const entries: RawEntry[] = fs
  .readFileSync(RAW_PATH, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.length > 0)
  .map((l, i) => {
    try {
      return JSON.parse(l) as RawEntry;
    } catch {
      return fail(`catalog-raw.jsonl ${i + 1}-ci sətir düzgün JSON deyil`);
    }
  });

console.log(`→ ${entries.length} sətir oxundu`);

// ── 2. Hər sourceFile diskdə varmı? ────────────────────────────────
const diskFiles = new Set(fs.readdirSync(SOURCE_DIR));
const referenced = new Set<string>();

for (const e of entries) {
  if (!diskFiles.has(e.sourceFile)) {
    problems.push(`Diskdə yoxdur: ${e.sourceFile}`);
  }
  if (referenced.has(e.sourceFile)) {
    problems.push(`Kataloqda iki dəfə var: ${e.sourceFile}`);
  }
  referenced.add(e.sourceFile);
}

// ── 3. Kataloqdan kənarda qalan şəkil varmı? ───────────────────────
for (const f of diskFiles) {
  if (!referenced.has(f)) problems.push(`Kataloqa düşməyib: ${f}`);
}

// ── 4. Kateqoriyalar düzgündürmü? ──────────────────────────────────
const validCategories = new Set<string>(SEED_CATEGORIES);
for (const e of entries) {
  if (!e.duplicateOf && !validCategories.has(e.category)) {
    problems.push(`Naməlum kateqoriya "${e.category}" — ${e.name}`);
  }
}

if (problems.length > 0) {
  console.error("\n✗ Problemlər:");
  for (const p of problems) console.error(`   ${p}`);
  fail(`${problems.length} problem tapıldı — kataloq qurulmadı`);
}

console.log("  ✓ Bütün fayllar yoxlanıldı, uyğunsuzluq yoxdur");

// ── 5. Məhsulları qur ──────────────────────────────────────────────
const products = new Map<string, Product>();

// Əvvəlcə əsas məhsullar
for (const e of entries) {
  if (e.duplicateOf) continue;
  if (products.has(e.slug)) fail(`Təkrarlanan slug: ${e.slug}`);
  if (!e.targetFile) fail(`targetFile boşdur: ${e.name}`);

  products.set(e.slug, {
    name: e.name,
    slug: e.slug,
    category: e.category,
    description: e.description,
    colors: [...e.colors],
    price: e.price,
    salePrice: e.salePrice,
    stock: e.stock,
    isFeatured: e.isFeatured,
    genderHint: e.genderHint,
    images: [`/uploads/products/${e.targetFile}`],
    sourceFiles: [e.sourceFile],
    confidence: e.confidence,
  });
}

// Sonra əlavə şəkillər
let extraImages = 0;
let skippedDupes = 0;
for (const e of entries) {
  if (!e.duplicateOf) continue;

  const target = products.get(e.duplicateOf);
  if (!target) fail(`duplicateOf naməlum slug göstərir: ${e.duplicateOf}`);

  // targetFile yoxdursa bu, tam eyni şəkildir — atılır
  if (!e.targetFile) {
    skippedDupes++;
    continue;
  }

  target.images.push(`/uploads/products/${e.targetFile}`);
  target.sourceFiles.push(e.sourceFile);
  for (const c of e.colors) {
    if (!target.colors.includes(c)) target.colors.push(c);
  }
  extraImages++;
}

const list = [...products.values()].sort((a, b) =>
  a.category === b.category
    ? a.name.localeCompare(b.name, "az")
    : SEED_CATEGORIES.indexOf(a.category as (typeof SEED_CATEGORIES)[number]) -
      SEED_CATEGORIES.indexOf(b.category as (typeof SEED_CATEGORIES)[number])
);

console.log(`  ✓ ${list.length} məhsul, ${extraImages} əlavə şəkil, ${skippedDupes} eyni fayl atıldı`);

// ── 6. Şəkilləri kopyala ───────────────────────────────────────────
fs.mkdirSync(TARGET_DIR, { recursive: true });

let copied = 0;
for (const e of entries) {
  if (!e.targetFile) continue;
  const src = path.join(SOURCE_DIR, e.sourceFile);
  const dst = path.join(TARGET_DIR, e.targetFile);
  fs.copyFileSync(src, dst); // mənbə fayl toxunulmaz qalır
  copied++;
}
console.log(`  ✓ ${copied} şəkil public/uploads/products/ qovluğuna kopyalandı`);

// ── 7. Hər şəklin diskdə olduğunu son dəfə yoxla ───────────────────
for (const p of list) {
  for (const img of p.images) {
    const abs = path.join(ROOT, "public", img.replace(/^\//, ""));
    if (!fs.existsSync(abs)) fail(`Kopyalanmış şəkil tapılmadı: ${img} (${p.name})`);
  }
}
console.log("  ✓ Bütün şəkil yolları diskdə mövcuddur");

// ── 8. Nəticəni yaz ────────────────────────────────────────────────
fs.writeFileSync(OUT_PATH, JSON.stringify(list, null, 2) + "\n", "utf8");
console.log(`\n✓ ${OUT_PATH} yazıldı\n`);

// ── 9. Xülasə ──────────────────────────────────────────────────────
const byCategory = new Map<string, number>();
for (const p of list) byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1);

console.log("Kateqoriya üzrə:");
for (const c of SEED_CATEGORIES) {
  const n = byCategory.get(c) ?? 0;
  console.log(`  ${n === 0 ? "!" : " "} ${c.padEnd(20)} ${n}`);
}

const lowConfidence = list.filter((p) => p.confidence !== "high");
if (lowConfidence.length > 0) {
  console.log(`\nƏmin olunmayan ${lowConfidence.length} məhsul (yoxlanmalıdır):`);
  for (const p of lowConfidence) console.log(`  - ${p.name}  →  ${p.category}`);
}
console.log("");
