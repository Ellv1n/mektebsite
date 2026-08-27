import Link from "next/link";

import { CheckoutForm } from "@/components/shop/CheckoutForm";

export const metadata = {
  title: "Sifarişin tamamlanması",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <nav className="mb-3 text-sm text-gray-500" aria-label="Naviqasiya">
        <Link href="/" className="hover:text-brand-700">
          Ana səhifə
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/sebet" className="hover:text-brand-700">
          Səbət
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">Sifariş</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Sifarişin tamamlanması</h1>
      <p className="mt-1 text-sm text-gray-500">
        Məlumatları doldurun — sifarişi təsdiqləmək üçün sizinlə əlaqə saxlayacağıq.
      </p>

      <CheckoutForm />
    </main>
  );
}
