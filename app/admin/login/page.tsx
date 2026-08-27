import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/LoginForm";
import { STORE_INFO } from "@/lib/constants";
import { getAdminSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Admin girişi",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Artıq giriş edibsə birbaşa panelə keçsin
  const session = await getAdminSession();
  if (session) redirect("/admin");

  const { next } = await searchParams;
  // Açıq yönləndirmənin qarşısını alırıq: yalnız /admin ilə başlayan daxili yollar
  const nextPath = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-brand-700">{STORE_INFO.name}</h1>
          <p className="mt-1 text-sm text-gray-500">İdarəetmə paneli</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <LoginForm nextPath={nextPath} />
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Bu səhifə yalnız mağaza əməkdaşları üçündür.
        </p>
      </div>
    </main>
  );
}
