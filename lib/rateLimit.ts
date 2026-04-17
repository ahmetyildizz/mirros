/**
 * Redis tabanlı rate limiter.
 * Her instance aynı sayacı paylaşır — serverless/multi-instance ortamlarda güvenli.
 * Redis bağlantısı yoksa istek geçişine izin verir (graceful fallback).
 */

import { redis } from "@/lib/redis";

export async function rateLimit(
  key: string,
  { max = 10, windowMs = 60_000 }: { max?: number; windowMs?: number } = {}
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    if (!redis.isReady) {
      // Redis hazır değil — kısıtlama yapma, geçişe izin ver
      return { allowed: true, remaining: max };
    }
    const redisKey = `rate:${key}`;
    const count = await Promise.race([
      redis.incr(redisKey),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Redis timeout")), 2000)),
    ]) as number;
    if (count === 1) {
      await redis.pExpire(redisKey, windowMs).catch(() => {});
    }
    const allowed   = count <= max;
    const remaining = Math.max(0, max - count);
    return { allowed, remaining };
  } catch {
    // Redis bağlantı hatası veya timeout — kısıtlama yapma
    return { allowed: true, remaining: max };
  }
}
