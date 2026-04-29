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
    const redisKey = `rl2:${key}`;
    const windowSec = Math.ceil(windowMs / 1000);
    // Fixed window: SET NX ile pencere oluştur (tüm Redis versiyonlarında çalışır), INCR ile say
    await redis.set(redisKey, 0, { EX: windowSec, NX: true });
    const count = await redis.incr(redisKey);
    return { allowed: count <= max, remaining: Math.max(0, max - count) };
  } catch (err) {
    console.error(`[rateLimit] Redis hatası — ${key} için rate limit atlanıyor:`, err);
    return { allowed: true, remaining: max };
  }
}
