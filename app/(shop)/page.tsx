import Image from "next/image";
import Link from "next/link";

import { ProductCard } from "@/components/shop/ProductCard";
import { STORE_INFO } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { toShopProduct } from "@/lib/shop";

export const metadata = {
  // `absolute` olmasa kök layout-un şablonu " | Məktəbli Səbəti" əlavə edir
  // və ad başlıqda iki dəfə görünür.
  title: { absolute: `${STORE_INFO.name} — Məktəb ləvazimatları onlayn mağazası` },
  description:
    "Dəftər, qələm, boya, penal, termos və bütün məktəb ləvazimatları. Bakı üzrə çatdırılma, nağd ödəniş.",
};

const PRODUCT_SELECT = {
  id: true,
  slug: true,
  name: true,
  images: true,
  price: true,
  salePrice: true,
  colors: true,
  stock: true,
  category: { select: { name: true, slug: true } },
} as const;

export default async function HomePage() {
  const [categories, categoryCovers, newProducts, featuredProducts] = await Promise.all([
    prisma.category.findMany({
      where: { products: { some: { isActive: true } } },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        image: true,
        _count: { select: { products: true } },
      },
    }),
    // Kateqoriya kartı üçün örtük şəkli: hər kateqoriyadan bir məhsulun şəkli
    prisma.product.findMany({
      where: { isActive: true, NOT: { images: { isEmpty: true } } },
      distinct: ["categoryId"],
      orderBy: { createdAt: "desc" },
      select: { categoryId: true, images: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: PRODUCT_SELECT,
    }),
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: PRODUCT_SELECT,
    }),
  ]);

  const coverByCategory = new Map(
    categoryCovers.map((c) => [c.categoryId, c.images[0] ?? null])
  );

  return (
    <main>
      {/* Hero — məktəb mövsümü */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-sun-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-900">
              Məktəb mövsümü
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
              Məktəbə hazırlıq
              <br />
              bir yerdən
            </h1>
            <p className="mt-4 text-base text-brand-50 sm:text-lg">
              Dəftər, qələm, boya, penal, termos və daha çoxu. Rəngini, oğlan ya qız üçün
              olduğunu özünüz seçin — biz çatdıraq.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/mehsullar"
                className="rounded-xl bg-accent-500 px-6 py-3 text-base font-bold text-white transition hover:bg-accent-600"
              >
                Alış-verişə başla
              </Link>
              <Link
                href="/mehsullar?sirala=ucuz"
                className="rounded-xl bg-white/15 px-6 py-3 text-base font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/25"
              >
                Ən sərfəli qiymətlər
              </Link>
            </div>
            <p className="mt-5 text-sm text-brand-50">
              Ödəniş yalnız nağd — çatdırılma zamanı
            </p>
          </div>
        </div>
      </section>

      {/* Kateqoriyalar */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <h2 className="mb-5 text-xl font-bold text-gray-900 sm:text-2xl">Kateqoriyalar</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => {
            const cover = category.image ?? coverByCategory.get(category.id) ?? null;
            return (
              <li key={category.id}>
                <Link
                  href={`/mehsullar?kateqoriya=${category.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-brand-300 hover:shadow-sm"
                >
                  <div className="relative aspect-[4/3] bg-gray-50">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 180px"
                        className="object-contain p-2 transition group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-xs text-gray-300">
                        şəkil yoxdur
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm font-semibold text-gray-900">{category.name}</p>
                    <p className="text-xs text-gray-500">{category._count.products} məhsul</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <ProductSection
        title="Populyar məhsullar"
        href="/mehsullar"
        products={featuredProducts.map(toShopProduct)}
      />

      <ProductSection
        title="Yeni məhsullar"
        href="/mehsullar"
        products={newProducts.map(toShopProduct)}
      />
    </main>
  );
}

function ProductSection({
  title,
  href,
  products,
}: {
  title: string;
  href: string;
  products: ReturnType<typeof toShopProduct>[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 sm:pb-14">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h2>
        <Link href={href} className="text-sm font-medium text-brand-600 hover:text-brand-700">
          Hamısına bax →
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
