import { SignJWT, jwtVerify } from "jose";

/**
 * Admin sessiyası — JWT + httpOnly cookie.
 *
 * `jose` kitabxanası seçilib, çünki Next.js middleware **Edge runtime**-də işləyir
 * və `jsonwebtoken` kimi Node kitabxanaları orada işləmir.
 *
 * ⚠️ Bu fayl `next/headers` import ETMİR — middleware-də də işləməlidir.
 * Cookie ilə işləyən köməkçilər `lib/session.ts` faylındadır.
 */

export const SESSION_COOKIE = "sederek_admin";

/** Sessiyanın ömrü — 8 saat (bir iş günü). */
export const SESSION_MAX_AGE = 60 * 60 * 8;

const ALG = "HS256";

export type AdminSession = {
  adminId: string;
  username: string;
};

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      "AUTH_SECRET .env faylında təyin edilməyib və ya 32 simvoldan qısadır. " +
        'Yaratmaq üçün: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return new TextEncoder().encode(secret.trim());
}

export async function createSessionToken(session: AdminSession): Promise<string> {
  return new SignJWT({ username: session.username })
    .setProtectedHeader({ alg: ALG })
    .setSubject(session.adminId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

/**
 * Cookie-yə `Secure` bayrağı qoyulmalıdırmı?
 *
 * ⚠️ Burada `NODE_ENV === "production"` yoxlaması İŞLƏMİR: lokalda
 * `npm run build && npm start` da produksiya rejimidir, amma ünvan
 * `http://localhost:3000`-dır. `Secure` cookie HTTP üzərindən ümumiyyətlə
 * göndərilmir — nəticədə admin panelə giriş mümkünsüz olur.
 *
 * Ona görə sorğunun HƏQİQİ protokoluna baxırıq. Vercel/nginx arxasında
 * `x-forwarded-proto` başlığı düzgün dəyəri verir.
 */
export function isSecureRequest(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0].trim().toLowerCase() === "https";
  }
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

/** Etibarsız və ya vaxtı keçmiş token üçün `null` qaytarır — heç vaxt exception atmır. */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<AdminSession | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
    if (typeof payload.sub !== "string" || typeof payload.username !== "string") {
      return null;
    }
    return { adminId: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}
