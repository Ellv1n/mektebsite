import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * `/admin` altındakı bütün səhifələri və `/api/admin` route-larını qoruyur
 * (ecommerce.md §3.1, §6).
 *
 * Giriş etməyən istifadəçi:
 *   - səhifəyə keçəndə  → /admin/login ünvanına yönləndirilir
 *   - API-yə müraciətdə → 401 JSON cavabı alır
 */

/** Sessiya tələb etməyən yollar. */
const PUBLIC_PATHS = new Set(["/admin/login", "/api/admin/login"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (session) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Bu əməliyyat üçün admin girişi tələb olunur." },
      { status: 401 }
    );
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";
  // Girişdən sonra istifadəçini istədiyi səhifəyə qaytarmaq üçün
  if (pathname !== "/admin") {
    loginUrl.searchParams.set("next", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
