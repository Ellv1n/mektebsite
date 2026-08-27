import Image from "next/image";
import Link from "next/link";

import { QuickAddButton } from "./QuickAddButton";
import { formatQepik } from "@/lib/money";
import { discountPercent, type ShopProduct } from "@/lib/shop";

export function ProductCard({ product }: { product: ShopProduct }) {
  const discount = discountPercent(product);

  return (
    // h-full — şəbəkədəki bütün kartlar eyni hündürlükdə olsun
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-brand-200 hover:shadow-sm">
      <Link href={`/mehsul/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-white">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
              // object-cover — uzun şəkillər kvadrata kəsilir, bütün kartlar eyni görünür.
              // Məhsul səhifəsindəki qalereyada isə object-contain qalır ki, məhsul tam görünsün.
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-sm text-gray-300">
              şəkil yoxdur
            </span>
          )}

          {discount && (
            <span className="absolute left-2 top-2 rounded-full bg-accent-500 px-2 py-0.5 text-xs font-bold text-white">
              −{discount}%
            </span>
          )}
          {product.stock <= 0 && (
            <span className="absolute right-2 top-2 rounded-full bg-gray-700 px-2 py-0.5 text-xs font-semibold text-white">
              Bitib
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link href={`/mehsul/${product.slug}`} className="block">
          {/* min-h — bir sətirlik və iki sətirlik adlar eyni yer tutsun */}
          <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-gray-900 hover:text-brand-700">
            {product.name}
          </h3>
        </Link>

        {/* h-7 — endirimli və adi qiymətli kartlarda sətir eyni hündürlükdə qalsın */}
        <div className="mt-2 flex h-7 items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">{formatQepik(product.priceQepik)}</span>
          {product.oldPriceQepik && (
            <span className="text-sm text-gray-400 line-through">
              {formatQepik(product.oldPriceQepik)}
            </span>
          )}
        </div>

        {/* mt-auto — düymə həmişə kartın altına yapışsın */}
        <div className="mt-auto pt-3">
          <QuickAddButton
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              images: product.images,
              priceQepik: product.priceQepik,
              colors: product.colors,
              stock: product.stock,
            }}
          />
        </div>
      </div>
    </article>
  );
}
