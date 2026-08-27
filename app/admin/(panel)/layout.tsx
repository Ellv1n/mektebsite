import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/AdminNav";
import { STORE_INFO } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";

export const metadata: Metadata = {
  title: { default: "İdarə paneli", template: `%s | ${STORE_INFO.name} admin` },
  robots: { index: false, follow: false },
};

// Admin paneli həmişə cari məlumatı göstərməlidir
export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware artıq route-u qoruyur; bu, ikinci qat yoxlamadır
  const session = await requireAdminSession();

  const newOrderCount = await prisma.order.count({ where: { status: "NEW" } });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav username={session.username} newOrderCount={newOrderCount} />
      {/* Çap zamanı yan menyu gizlənir — soldakı boşluq da götürülür */}
      <div className="lg:pl-60 print:pl-0">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10 print:max-w-none print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
