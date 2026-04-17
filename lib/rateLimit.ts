/**
 * Redis tabanlı rate limiter.
 * Her instance aynı sayacı paylaşır — serverless/multi-instance ortamlarda güvenli.
 */

import { redis } from "@/lib/redis";

export async function rateLimit(
  key: string,
  { max = 10, windowMs = 60_000 }: { max?: number; windowMs?: number } = {}
): Promise<{ allowed: boolean; remaining: number }> {
  const redisKey = `rate:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.pExpire(redisKey, windowMs);
  }
  const allowed   = count <= max;
  const remaining = Math.max(0, max - count);
  return { allowed, remaining };
}
