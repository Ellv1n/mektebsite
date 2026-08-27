import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE, verifySessionToken, type AdminSession } from "./auth";

/**
 * Server Component və API route-larda admin sessiyasını oxumaq üçün.
 * Middleware ilə ikiqat qorunma: middleware route-u bağlayır,
 * bu funksiya isə səhifə/route daxilində sessiyanı təsdiqləyir.
 */

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Sessiya yoxdursa giriş səhifəsinə yönləndirir. Yalnız səhifələrdə işlət. */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
