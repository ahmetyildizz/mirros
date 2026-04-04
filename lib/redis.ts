import { createClient } from "redis";

const globalForRedis = globalThis as unknown as { redis: ReturnType<typeof createClient> };

export const redis =
  globalForRedis.redis ??
  createClient({ url: process.env.REDIS_URL ?? "redis://localhost:6379" });

if (!globalForRedis.redis) {
  globalForRedis.redis = redis;
  redis.connect().catch(console.error);
}
