import Link from "next/link";

import { CartView } from "@/components/shop/CartView";

export const metadata = {
  title: "Səbət",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <nav className="mb-3 text-sm text-gray-500" aria-label="Naviqasiya">
        <Link href="/" className="hover:text-brand-700">
          Ana səhifə
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">Səbət</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Səbət</h1>

      <CartView />
    </main>
  );
}
