import { NextRequest } from "next/server"
import { getRedisClient } from "@/lib/redis/client"
import { ApiError } from "@/lib/http/errors"

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (request: NextRequest) => string
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyGenerator: (request) => {
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.ip || "unknown"
    return `rate_limit:${ip}`
  }
}

export async function enforceRateLimit(
  request: NextRequest, 
  config: Partial<RateLimitConfig> = {}
): Promise<void> {
  const redis = getRedisClient()
  if (!redis) {
    // Redis not available, skip rate limiting
    return
  }

  const finalConfig = { ...defaultConfig, ...config }
  const key = finalConfig.keyGenerator!(request)
  
  try {
    const current = await redis.incr(key)
    
    if (current === 1) {
      // First request in window, set expiration
      await redis.expire(key, Math.ceil(finalConfig.windowMs / 1000))
    }
    
    if (current > finalConfig.maxRequests) {
      throw new ApiError("Rate limit exceeded", 429)
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    // Redis error, log but don't block request
    console.error("Rate limiting error:", error)
  }
}

export async function getRateLimitInfo(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): Promise<{ remaining: number; resetTime: number }> {
  const redis = getRedisClient()
  if (!redis) {
    return { remaining: 999, resetTime: Date.now() + 15 * 60 * 1000 }
  }

  const finalConfig = { ...defaultConfig, ...config }
  const key = finalConfig.keyGenerator!(request)
  
  try {
    const current = await redis.get(key)
    const ttl = await redis.ttl(key)
    
    return {
      remaining: Math.max(0, finalConfig.maxRequests - (parseInt(current || "0"))),
      resetTime: Date.now() + (ttl * 1000)
    }
  } catch (error) {
    console.error("Rate limit info error:", error)
    return { remaining: 999, resetTime: Date.now() + 15 * 60 * 1000 }
  }
}