import { NextResponse } from "next/server";

import { isSecureRequest, SESSION_COOKIE } from "@/lib/auth";

/**
 * Sessiya cookie-sini silir.
 * Cookie-nin silinməsi üçün atributlar (path, secure, sameSite) yazılandakı
 * ilə eyni olmalıdır — əks halda brauzer köhnə cookie-ni saxlayır.
 */
export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0,
  });
  return response;
}
