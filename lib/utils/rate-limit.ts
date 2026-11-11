interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

/**
 * In-memory sliding-window rate limiter (NFR-01: maks 10 req/menit per IP).
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const entry = store.get(key) ?? { timestamps: [] };

  entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    store.set(key, entry);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    retryAfterSeconds: 0,
  };
}

