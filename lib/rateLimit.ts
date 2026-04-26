/**
 * Redis tabanlı rate limiter.
 * Her instance aynı sayacı paylaşır — serverless/multi-instance ortamlarda güvenli.
 * Redis erişilemezse fail-open: rate limiting devre dışı kalır ama site ayakta kalır.
 */

import { redis } from "@/lib/redis";

export async function rateLimit(
  key: string,
  { max = 10, windowMs = 60_000 }: { max?: number; windowMs?: number } = {}
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    if (!redis.isReady) {
      console.warn(`[rateLimit] Redis hazır değil — ${key} için rate limit atlanıyor`);
      return { allowed: true, remaining: max };
    }
    const redisKey = `rate:${key}`;
    // Pipeline: INCR + PEXPIRE NX (NX = sadece TTL yoksa set et, var olanı uzatma)
    const results = await Promise.race([
      redis.multi().incr(redisKey).pExpire(redisKey, windowMs, "NX").exec(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Redis timeout")), 2000)
      ),
    ]);
    const count = results[0] as number;
    return { allowed: count <= max, remaining: Math.max(0, max - count) };
  } catch (err) {
    console.error(`[rateLimit] Redis hatası — ${key} için rate limit atlanıyor:`, err);
    return { allowed: true, remaining: max };
  }
}
