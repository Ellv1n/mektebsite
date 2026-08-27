import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartForm } from "@/components/shop/AddToCartForm";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatQepik } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { discountPercent, toShopProduct } from "@/lib/shop";

type Params = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      images: true,
      price: true,
      salePrice: true,
      colors: true,
      stock: true,
      category: { select: { name: true, slug: true } },
    },
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: "Məhsul tapılmadı" };

  return {
    title: product.name,
    description:
      product.description?.slice(0, 160) ??
      `${product.name} — ${product.category.name}. Çatdırılma zamanı nağd ödəniş.`,
  };
}

export default async function ProductDetailPage({ params }: Params) {
  const { slug } = await params;
  const raw = await getProduct(slug);
  if (!raw) notFound();

  const product = toShopProduct(raw);
  const discount = discountPercent(product);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <nav className="mb-4 text-sm text-gray-500" aria-label="Naviqasiya">
        <Link href="/" className="hover:text-brand-700">
          Ana səhifə
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={`/mehsullar?kateqoriya=${raw.category.slug}`} className="hover:text-brand-700">
          {raw.category.name}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <p className="text-sm text-gray-500">{raw.category.name}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-extrabold text-gray-900">
              {formatQepik(product.priceQepik)}
            </span>
            {product.oldPriceQepik && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  {formatQepik(product.oldPriceQepik)}
                </span>
                {discount && (
                  <span className="rounded-full bg-accent-500 px-2.5 py-1 text-sm font-bold text-white">
                    −{discount}%
                  </span>
                )}
              </>
            )}
          </div>

          <p className="mt-3 text-sm">
            {product.stock > 0 ? (
              <span className="font-medium text-green-700">Stokda var</span>
            ) : (
              <span className="font-medium text-red-600">Stokda yoxdur</span>
            )}
          </p>

          {raw.description && (
            <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="mb-2 text-sm font-semibold text-gray-900">Ətraflı</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {raw.description}
              </p>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <AddToCartForm
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                image: product.image,
                priceQepik: product.priceQepik,
                colors: product.colors,
                stock: product.stock,
              }}
            />
          </div>

          <ul className="mt-5 space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>{PAYMENT_METHOD_LABEL}</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>Rəngi və qeydi sifariş verərkən özünüz yazırsınız</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>Sifarişdən sonra sizinlə telefonla əlaqə saxlanılır</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
