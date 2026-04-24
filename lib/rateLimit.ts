/**
 * Redis tabanlı rate limiter.
 * Her instance aynı sayacı paylaşır — serverless/multi-instance ortamlarda güvenli.
 * Redis erişilemezse fail-open: rate limiting devre dışı kalır ama site ayakta kalır.
 * Kritik endpointlerin kendi fallback'i olmalı; burada availability önceliklendirilir.
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
    const count = await Promise.race([
      redis.incr(redisKey),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Redis timeout")), 2000)
      ),
    ]) as number;
    if (count === 1) {
      await redis.pExpire(redisKey, windowMs).catch(() => {});
    }
    const allowed   = count <= max;
    const remaining = Math.max(0, max - count);
    return { allowed, remaining };
  } catch (err) {
    // Redis timeout veya bağlantı hatası → fail-open, ama log'la
    console.error(`[rateLimit] Redis hatası — ${key} için rate limit atlanıyor:`, err);
    return { allowed: true, remaining: max };
  }
}
