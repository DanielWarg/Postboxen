import Redis from "ioredis"

import { env } from "@/lib/config"

let redis: Redis | null = null

export const getRedisClient = () => {
  if (!env.REDIS_URL) {
    return null
  }
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    })
  }
  return redis
}
