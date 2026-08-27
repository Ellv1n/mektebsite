import { effectivePriceQepik, toQepik, type MoneyInput } from "./money";

/**
 * Bazadakı məhsulu müştəri tərəfi üçün sadə, JSON-a çevrilə bilən formaya salır.
 * Prisma `Decimal` tipi Client Component-lərə ötürülə bilmir — qəpiyə çevirilir.
 */

export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  images: string[];
  /** Satış qiyməti (endirim varsa endirimli), qəpiklə */
  priceQepik: number;
  /** Endirim varsa üstündən xətli göstəriləcək köhnə qiymət, qəpiklə */
  oldPriceQepik: number | null;
  colors: string[];
  stock: number;
  categoryName: string | null;
  categorySlug: string | null;
};

type PrismaProductLike = {
  id: string;
  slug: string;
  name: string;
  images: string[];
  price: MoneyInput;
  salePrice: MoneyInput | null;
  colors: string[];
  stock: number;
  category?: { name: string; slug: string } | null;
};

export function toShopProduct(product: PrismaProductLike): ShopProduct {
  const basePrice = toQepik(product.price);
  const effective = effectivePriceQepik(product.price, product.salePrice);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    image: product.images[0] ?? null,
    images: product.images,
    priceQepik: effective,
    oldPriceQepik: effective < basePrice ? basePrice : null,
    colors: product.colors,
    stock: product.stock,
    categoryName: product.category?.name ?? null,
    categorySlug: product.category?.slug ?? null,
  };
}

/** Endirim faizi — nişan üçün, məs. `-20%` */
export function discountPercent(product: ShopProduct): number | null {
  if (!product.oldPriceQepik || product.oldPriceQepik <= 0) return null;
  const percent = Math.round(
    ((product.oldPriceQepik - product.priceQepik) / product.oldPriceQepik) * 100
  );
  return percent > 0 ? percent : null;
}
