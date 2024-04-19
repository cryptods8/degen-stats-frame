import { Redis } from "@upstash/redis";

const url = process.env.REDIS_URL;
const token = process.env.REDIS_TOKEN;

let redis: Redis | null;
if (!url || !token) {
  console.warn("REDIS_URL and REDIS_TOKEN are required");
  redis = null;
} else {
  redis = new Redis({
    url,
    token,
  });
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export async function fetchFromCache<T>(
  key: string
): Promise<CacheEntry<T> | null> {
  if (!redis) {
    return null;
  }
  return redis.get<CacheEntry<T>>(key);
}

export async function saveToCache<T>(
  key: string,
  value: T,
  ttl: number
): Promise<void> {
  if (!redis) {
    return;
  }
  const entry: CacheEntry<T> = {
    value,
    timestamp: Date.now(),
  };
  await redis.setex(key, ttl, entry);
}
