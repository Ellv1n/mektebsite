"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useCart } from "./CartProvider";
import { STORE_INFO } from "@/lib/constants";

export type HeaderCategory = { slug: string; name: string };

export function SiteHeader({ categories }: { categories: HeaderCategory[] }) {
  const { count, ready } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Səhifə dəyişəndə mobil menyu bağlansın.
  // `useSearchParams` qəsdən işlədilmir — o, Suspense sərhədi tələb edir.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center gap-3 py-3">
          <Link
            href="/"
            className="shrink-0 whitespace-nowrap text-lg font-extrabold leading-tight text-brand-700 sm:text-xl lg:text-2xl"
          >
            {STORE_INFO.name}
          </Link>

          {/* Axtarış — JavaScript olmadan da işləyir */}
          <form action="/mehsullar" method="GET" className="hidden flex-1 sm:block">
            <label htmlFor="site-search" className="sr-only">
              Məhsul axtar
            </label>
            <input
              id="site-search"
              type="search"
              name="q"
              placeholder="Dəftər, qələm, penal axtar…"
              className="w-full rounded-full border border-gray-300 px-4 py-2 text-base outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </form>

          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <Link
              href="/sebet"
              className="relative flex items-center gap-2 rounded-full border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              <CartIcon />
              <span className="hidden sm:inline">Səbət</span>
              {ready && count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-xs font-bold text-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Menyunu bağla" : "Kateqoriyalar"}
              className="rounded-full border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 lg:hidden"
            >
              {menuOpen ? "Bağla" : "Menyu"}
            </button>
          </div>
        </div>

        {/* Mobil axtarış */}
        <form action="/mehsullar" method="GET" className="pb-3 sm:hidden">
          <label htmlFor="site-search-mobile" className="sr-only">
            Məhsul axtar
          </label>
          <input
            id="site-search-mobile"
            type="search"
            name="q"
            placeholder="Dəftər, qələm, penal axtar…"
            className="w-full rounded-full border border-gray-300 px-4 py-2 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </form>

        {/* Kateqoriya menyusu — masaüstündə həmişə görünür */}
        <nav className="hidden gap-1 overflow-x-auto pb-2 lg:flex" aria-label="Kateqoriyalar">
          <Link
            href="/mehsullar"
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-brand-50 hover:text-brand-700"
          >
            Hamısı
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/mehsullar?kateqoriya=${category.slug}`}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-brand-50 hover:text-brand-700"
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobil kateqoriya menyusu */}
      {menuOpen && (
        <div className="border-t border-gray-200 bg-white lg:hidden">
          <nav className="mx-auto grid max-w-6xl grid-cols-2 gap-1 px-4 py-3" aria-label="Kateqoriyalar">
            <Link
              href="/mehsullar"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              Bütün məhsullar
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/mehsullar?kateqoriya=${category.slug}`}
                className="rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function CartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h2.2l2.3 12.2a1.6 1.6 0 0 0 1.6 1.3h9.2a1.6 1.6 0 0 0 1.6-1.3L21 7H5" />
    </svg>
  );
}
