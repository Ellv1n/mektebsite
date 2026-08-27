"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { STORE_INFO } from "@/lib/constants";

type NavItem = {
  href: string;
  label: string;
  /** Yanında göstəriləcək say (məs. baxılmamış sifarişlər) */
  badge?: number;
};

export function AdminNav({
  username,
  newOrderCount,
}: {
  username: string;
  newOrderCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Səhifə dəyişəndə mobil menyu bağlansın
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const items: NavItem[] = [
    { href: "/admin", label: "İdarə paneli" },
    { href: "/admin/sifarisler", label: "Sifarişlər", badge: newOrderCount },
    { href: "/admin/mehsullar", label: "Məhsullar" },
    { href: "/admin/kateqoriyalar", label: "Kateqoriyalar" },
    { href: "/admin/promokodlar", label: "Promokodlar" },
  ];

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Şəbəkə xətası olsa da giriş səhifəsinə qaytarırıq
    }
    router.replace("/admin/login");
    router.refresh();
  }

  const navLinks = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <span>{item.label}</span>
            {item.badge ? (
              <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-accent-500 px-2 py-0.5 text-xs font-bold text-white">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-gray-200 pt-4">
      <p className="px-3 text-xs text-gray-400">Giriş edilib</p>
      <p className="mb-3 px-3 text-sm font-medium text-gray-700">{username}</p>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
      >
        {loggingOut ? "Çıxılır…" : "Çıxış"}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobil üst panel */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <Link href="/admin" className="text-lg font-bold text-brand-700">
          {STORE_INFO.name}
          <span className="ml-2 text-xs font-normal text-gray-400">admin</span>
        </Link>
        <div className="flex items-center gap-2">
          {newOrderCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-accent-500 px-2.5 py-1 text-xs font-bold text-white">
              {newOrderCount} yeni
            </span>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Menyunu bağla" : "Menyunu aç"}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
          >
            {open ? "Bağla" : "Menyu"}
          </button>
        </div>
      </header>

      {/* Mobil açılan menyu */}
      {open && (
        <div className="no-print border-b border-gray-200 bg-white px-4 py-4 lg:hidden">
          {navLinks}
          <div className="mt-4">{footer}</div>
        </div>
      )}

      {/* Masaüstü yan panel */}
      <aside className="no-print fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-gray-200 bg-white px-4 py-6 lg:flex">
        <Link href="/admin" className="mb-8 px-3 text-xl font-bold text-brand-700">
          {STORE_INFO.name}
          <span className="ml-2 text-xs font-normal text-gray-400">admin</span>
        </Link>
        {navLinks}
        <div className="mt-auto">{footer}</div>
      </aside>
    </>
  );
}
