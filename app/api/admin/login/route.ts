import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  isSecureRequest,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import { getClientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

/**
 * Admin girişi (ecommerce.md §3.1).
 * Şifrə bazada bcrypt hash-i kimi saxlanılır, burada yalnız müqayisə edilir.
 */

const LoginSchema = z.object({
  username: z.string().trim().min(1, "İstifadəçi adını daxil edin"),
  password: z.string().min(1, "Şifrəni daxil edin"),
});

/**
 * İstifadəçi adı tapılmayanda da bcrypt müqayisəsi işə salınır ki,
 * cavab müddətindən istifadəçinin mövcudluğu bilinməsin (timing attack).
 * Bu, real bcrypt hash-idir (cost 12) — heç bir işlək şifrəyə uyğun gəlmir.
 */
const DUMMY_HASH = "$2b$12$DDTX9meu8siVDMyxN2enj.YrwEeel9vcP5TCLYKWBoA/4mAhP/5aS";

// 15 dəqiqədə maksimum 10 cəhd
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

const GENERIC_ERROR = "İstifadəçi adı və ya şifrə yanlışdır.";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limit = rateLimit(`admin-login:${ip}`, MAX_ATTEMPTS, WINDOW_MS);

  if (!limit.ok) {
    const minutes = Math.ceil(limit.retryAfterSeconds / 60);
    return NextResponse.json(
      { error: `Çox sayda uğursuz cəhd. ${minutes} dəqiqə sonra yenidən yoxlayın.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Sorğu formatı düzgün deyil." }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Məlumatlar tam deyil." },
      { status: 400 }
    );
  }

  const { username, password } = parsed.data;

  const admin = await prisma.admin.findUnique({ where: { username } });
  const passwordMatches = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);

  if (!admin || !passwordMatches) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  resetRateLimit(`admin-login:${ip}`);

  const token = await createSessionToken({ adminId: admin.id, username: admin.username });

  const response = NextResponse.json({ ok: true, username: admin.username });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}
