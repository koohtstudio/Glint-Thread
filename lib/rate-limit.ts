/**
 * Fixed-window in-memory rate limiter (PRD 9.2: in-memory LRU is acceptable for v1).
 * Per-instance on serverless; good enough to blunt abuse of checkout, forms and lookups.
 */
interface Bucket {
  count: number
  resetAt: number
}

const MAX_KEYS = 5000

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const buckets = new Map<string, Bucket>()
  return {
    check(
      key: string,
      now = Date.now(),
    ): { ok: boolean; remaining: number; retryAfterSeconds: number } {
      let bucket = buckets.get(key)
      if (!bucket || bucket.resetAt <= now) {
        bucket = { count: 0, resetAt: now + windowMs }
      }
      // LRU: re-insert to mark as most recent and evict the oldest when full.
      buckets.delete(key)
      buckets.set(key, bucket)
      if (buckets.size > MAX_KEYS) buckets.delete(buckets.keys().next().value as string)
      bucket.count++
      const ok = bucket.count <= limit
      return {
        ok,
        remaining: Math.max(0, limit - bucket.count),
        retryAfterSeconds: ok ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
      }
    },
    reset() {
      buckets.clear()
    },
  }
}

export const limiters = {
  checkout: createRateLimiter({ limit: 10, windowMs: 60_000 }),
  quote: createRateLimiter({ limit: 120, windowMs: 60_000 }),
  newsletter: createRateLimiter({ limit: 5, windowMs: 60_000 }),
  contact: createRateLimiter({ limit: 5, windowMs: 60_000 }),
  orderStatus: createRateLimiter({ limit: 10, windowMs: 60_000 }),
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown'
  )
}

export function tooManyRequests(retryAfterSeconds: number) {
  return Response.json(
    { error: 'rate_limited', message: "That's a lot of tries. Wait a minute, then try again." },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  )
}
