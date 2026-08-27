import type { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { formatAzn } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Məhsullar" };

const PER_PAGE = PRODUCTS_PER_PAGE * 2; // admin siyahısında daha çox sətir

type SearchParams = {
  q?: string;
  kateqoriya?: string;
  stok?: string;
  sehife?: string;
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const categorySlug = params.kateqoriya ?? "";
  const stockFilter = params.stok ?? "";
  const page = Math.max(1, Number(params.sehife) || 1);

  const where: Prisma.ProductWhereInput = {
    ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(stockFilter === "bitib" ? { stock: { lte: 0 } } : {}),
    ...(stockFilter === "deaktiv" ? { isActive: false } : {}),
  };

  const [categories, total, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: { order: "asc" },
      select: { slug: true, name: true, _count: { select: { products: true } } },
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        name: true,
        images: true,
        price: true,
        salePrice: true,
        stock: true,
        isActive: true,
        isFeatured: true,
        category: { select: { name: true } },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  function pageHref(target: number) {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (categorySlug) sp.set("kateqoriya", categorySlug);
    if (stockFilter) sp.set("stok", stockFilter);
    if (target > 1) sp.set("sehife", String(target));
    const qs = sp.toString();
    return qs ? `/admin/mehsullar?${qs}` : "/admin/mehsullar";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Məhsullar</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} məhsul tapıldı
            {query || categorySlug || stockFilter ? " (filtrlə)" : ""}
          </p>
        </div>
        <Link
          href="/admin/mehsullar/yeni"
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          + Yeni məhsul
        </Link>
      </div>

      {/* Axtarış və filtrlər — JavaScript olmadan işləyir */}
      <form method="GET" className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-[1fr_auto_auto_auto]">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Məhsul adı ilə axtar…"
          className="rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        <select
          name="kateqoriya"
          defaultValue={categorySlug}
          className="rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-brand-500"
        >
          <option value="">Bütün kateqoriyalar</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({c._count.products})
            </option>
          ))}
        </select>
        <select
          name="stok"
          defaultValue={stockFilter}
          className="rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-brand-500"
        >
          <option value="">Bütün məhsullar</option>
          <option value="bitib">Stokda bitib</option>
          <option value="deaktiv">Deaktiv</option>
        </select>
        <button
          type="submit"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Axtar
        </button>
      </form>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-700">Məhsul tapılmadı</p>
          <p className="mt-1 text-sm text-gray-500">
            Axtarış sözünü dəyişin və ya filtrləri sıfırlayın.
          </p>
          {(query || categorySlug || stockFilter) && (
            <Link
              href="/admin/mehsullar"
              className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Filtrləri sıfırla
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-semibold">Məhsul</th>
                <th className="px-4 py-3 font-semibold">Kateqoriya</th>
                <th className="px-4 py-3 text-right font-semibold">Qiymət</th>
                <th className="px-4 py-3 text-right font-semibold">Stok</th>
                <th className="px-4 py-3 font-semibold">Vəziyyət</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes="44px"
                            className="object-contain p-0.5"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-[9px] text-gray-400">
                            şəkil yox
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/admin/mehsullar/${product.id}`}
                        className="font-medium text-gray-900 hover:text-brand-700"
                      >
                        {product.name}
                      </Link>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {product.category.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {product.salePrice ? (
                      <>
                        <span className="text-gray-400 line-through">
                          {formatAzn(product.price)}
                        </span>{" "}
                        <span className="font-medium text-accent-700">
                          {formatAzn(product.salePrice)}
                        </span>
                      </>
                    ) : (
                      <span className="font-medium text-gray-900">{formatAzn(product.price)}</span>
                    )}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-right font-medium ${
                      product.stock <= 0 ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {product.stock}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {!product.isActive && <Tag tone="gray">Deaktiv</Tag>}
                      {product.isFeatured && <Tag tone="sun">Populyar</Tag>}
                      {product.stock <= 0 && <Tag tone="red">Bitib</Tag>}
                      {product.isActive && !product.isFeatured && product.stock > 0 && (
                        <Tag tone="green">Satışda</Tag>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link
                      href={`/admin/mehsullar/${product.id}`}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      Redaktə
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <nav className="flex items-center justify-between" aria-label="Səhifələmə">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
              href={pageHref(page + 1)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Növbəti →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}

function Tag({ tone, children }: { tone: "gray" | "green" | "red" | "sun"; children: React.ReactNode }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-700",
    sun: "bg-sun-100 text-yellow-800",
  } as const;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
  );
}
