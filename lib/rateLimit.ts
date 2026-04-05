/**
 * Basit in-process rate limiter.
 * Serverless'ta her instance ayrı sayaç tutar — production'da Redis'e taşı.
 * Şu an: IP başına windowMs içinde max istek.
 */

interface Entry { count: number; resetAt: number }
const store = new Map<string, Entry>();

export function rateLimit(
  key: string,
  { max = 10, windowMs = 60_000 }: { max?: number; windowMs?: number } = {}
): { allowed: boolean; remaining: number } {
  const now  = Date.now();
  const prev = store.get(key);

  if (!prev || now > prev.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }

  prev.count += 1;
  const allowed   = prev.count <= max;
  const remaining = Math.max(0, max - prev.count);
  return { allowed, remaining };
}
