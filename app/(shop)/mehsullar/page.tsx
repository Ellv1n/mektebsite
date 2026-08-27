import type { Prisma } from "@prisma/client";
import Link from "next/link";

import { ProductCard } from "@/components/shop/ProductCard";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { toShopProduct } from "@/lib/shop";

export const metadata = {
  title: "Məhsullar",
  description: "Bütün məktəb ləvazimatları — dəftər, qələm, boya, penal, termos və daha çoxu.",
};

type SearchParams = {
  q?: string;
  kateqoriya?: string;
  sirala?: string;
  sehife?: string;
};

const SORT_OPTIONS = [
  { value: "", label: "Əvvəlcə yenilər" },
  { value: "ucuz", label: "Ucuzdan bahaya" },
  { value: "baha", label: "Bahadan ucuza" },
  { value: "ad", label: "Ad üzrə (A-Z)" },
] as const;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const categorySlug = params.kateqoriya ?? "";
  const sort = params.sirala ?? "";
  const page = Math.max(1, Number(params.sehife) || 1);

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
  };

  // Qeyd: sıralama `price` sütunu üzrədir. Endirimli məhsullarda göstərilən
  // qiymət `salePrice` ola bilər — bu, siyahıda kiçik fərq yaradır.
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "ucuz"
      ? { price: "asc" }
      : sort === "baha"
        ? { price: "desc" }
        : sort === "ad"
          ? { name: "asc" }
          : { createdAt: "desc" };

  const [categories, activeCategory, total, products] = await Promise.all([
    prisma.category.findMany({
      where: { products: { some: { isActive: true } } },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { slug: true, name: true, _count: { select: { products: true } } },
    }),
    categorySlug
      ? prisma.category.findUnique({ where: { slug: categorySlug }, select: { name: true } })
      : Promise.resolve(null),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PRODUCTS_PER_PAGE,
      take: PRODUCTS_PER_PAGE,
      select: {
        id: true,
        slug: true,
        name: true,
        images: true,
        price: true,
        salePrice: true,
        colors: true,
        stock: true,
        category: { select: { name: true, slug: true } },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));

  function buildHref(overrides: Partial<SearchParams>) {
    const sp = new URLSearchParams();
    const q = overrides.q ?? query;
    const cat = overrides.kateqoriya ?? categorySlug;
    const s = overrides.sirala ?? sort;
    const p = overrides.sehife ?? "";

    if (q) sp.set("q", q);
    if (cat) sp.set("kateqoriya", cat);
    if (s) sp.set("sirala", s);
    if (p && p !== "1") sp.set("sehife", p);

    const qs = sp.toString();
    return qs ? `/mehsullar?${qs}` : "/mehsullar";
  }

  const heading = activeCategory?.name ?? (query ? `"${query}" üzrə axtarış` : "Bütün məhsullar");

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <nav className="mb-3 text-sm text-gray-500" aria-label="Naviqasiya">
        <Link href="/" className="hover:text-brand-700">
          Ana səhifə
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">{heading}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{heading}</h1>
      <p className="mt-1 text-sm text-gray-500">{total} məhsul tapıldı</p>

      {/* Filtrlər — JavaScript olmadan işləyir */}
      <form
        method="GET"
        className="mt-5 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-[1fr_auto_auto_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Məhsul adı ilə axtar…"
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        <select
          name="kateqoriya"
          defaultValue={categorySlug}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-500"
        >
          <option value="">Bütün kateqoriyalar</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({c._count.products})
            </option>
          ))}
        </select>
        <select
          name="sirala"
          defaultValue={sort}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-500"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-base font-semibold text-white transition hover:bg-brand-700"
        >
          Tətbiq et
        </button>
      </form>

      {products.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="text-base font-medium text-gray-700">Uyğun məhsul tapılmadı</p>
          <p className="mt-1 text-sm text-gray-500">
            Axtarış sözünü dəyişməyə və ya kateqoriya filtrini götürməyə cəhd edin.
          </p>
          <Link
            href="/mehsullar"
            className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Bütün məhsullara bax
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={toShopProduct(product)} />
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <nav className="mt-8 flex items-center justify-between gap-3" aria-label="Səhifələmə">
          {page > 1 ? (
            <Link
              href={buildHref({ sehife: String(page - 1) })}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Əvvəlki
            </Link>
          ) : (
            <span />
          )}

          <span className="text-sm text-gray-500">
            Səhifə {page} / {pageCount}
          </span>

          {page < pageCount ? (
            <Link
              href={buildHref({ sehife: String(page + 1) })}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Növbəti →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}
