/**
 * Sadə yaddaş əsaslı sürət limiti (ecommerce.md §6).
 *
 * Admin girişini və sifariş API-sini kobud hücumdan qoruyur.
 * Tək server prosesi üçün nəzərdə tutulub — çox nüsxəli deploy-da
 * Redis kimi paylaşılan saxlanc lazımdır.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Yaddaşın şişməməsi üçün vaxtı keçmiş qeydləri təmizləyir. */
function sweep(now: number) {
  if (buckets.size < 1000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count++;
  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { ok: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

/** Uğurlu əməliyyatdan sonra sayğacı sıfırlamaq üçün (məs. düzgün giriş). */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}

/**
 * Sorğunun IP ünvanını proxy başlıqlarını nəzərə alaraq tapır.
 * Həm `Request.headers`, həm də `next/headers`-dən gələn ReadonlyHeaders qəbul edir.
 */
export function getClientIp(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
