import { env } from "@/lib/config"
import { ApiError } from "@/lib/http/errors"

interface RateEntry {
  count: number
  reset: number
}

const buckets = new Map<string, RateEntry>()

const now = () => Date.now()

const keyFromRequest = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  // @ts-expect-error – NextRequest har ip-fält
  const ip = (request as any).ip
  return ip ?? "global"
}

export const enforceRateLimit = (request: Request) => {
  const key = keyFromRequest(request)
  const entry = buckets.get(key)
  const timestamp = now()

  if (!entry || entry.reset < timestamp) {
    buckets.set(key, { count: 1, reset: timestamp + env.RATE_LIMIT_WINDOW_MS })
    return
  }

  if (entry.count >= env.RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.reset - timestamp) / 1000)
    throw new ApiError(429, `Rate limit exceeded. Försök igen om ${retryAfter}s`)
  }

  entry.count += 1
}
