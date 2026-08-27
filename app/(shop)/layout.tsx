import { CartProvider } from "@/components/shop/CartProvider";
import { SiteFooter } from "@/components/shop/SiteFooter";
import { SiteHeader } from "@/components/shop/SiteHeader";
import { WhatsAppButton } from "@/components/shop/WhatsAppButton";
import { prisma } from "@/lib/prisma";

/**
 * Müştəri tərəfinin ümumi çərçivəsi: header + footer + səbət konteksti.
 * Admin paneli bu layout-dan istifadə etmir.
 *
 * ⚠️ `force-dynamic` mütləqdir. Bu olmadan Next.js ana səhifəni və kateqoriya
 * menyusunu BUILD ANINDA prerender edir — admin yeni məhsul əlavə etsə,
 * saytda yalnız növbəti build-dən sonra görünərdi.
 * Bu ayar layout-dan bütün alt səhifələrə keçir.
 */
export const dynamic = "force-dynamic";
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // Boş kateqoriyalar menyuda göstərilmir
  const categories = await prisma.category.findMany({
    where: { products: { some: { isActive: true } } },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { slug: true, name: true },
  });

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader categories={categories} />
        <div className="flex-1">{children}</div>
        <SiteFooter categories={categories} />
        <WhatsAppButton />
      </div>
    </CartProvider>
  );
}
