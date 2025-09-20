import { getRedisClient } from "@/lib/redis/client"

interface CacheOptions {
  ttl?: number // Time to live in seconds
  prefix?: string
}

export class CacheService {
  private redis = getRedisClient()
  private defaultTTL = 300 // 5 minutes

  private getKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.redis) return null

    try {
      const fullKey = this.getKey(key, options.prefix)
      const value = await this.redis.get(fullKey)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error("Cache get error:", error)
      return null
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    if (!this.redis) return

    try {
      const fullKey = this.getKey(key, options.prefix)
      const ttl = options.ttl || this.defaultTTL
      await this.redis.setex(fullKey, ttl, JSON.stringify(value))
    } catch (error) {
      console.error("Cache set error:", error)
    }
  }

  async del(key: string, options: CacheOptions = {}): Promise<void> {
    if (!this.redis) return

    try {
      const fullKey = this.getKey(key, options.prefix)
      await this.redis.del(fullKey)
    } catch (error) {
      console.error("Cache delete error:", error)
    }
  }

  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.redis) return false

    try {
      const fullKey = this.getKey(key, options.prefix)
      const result = await this.redis.exists(fullKey)
      return result === 1
    } catch (error) {
      console.error("Cache exists error:", error)
      return false
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.redis) return

    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.error("Cache invalidate pattern error:", error)
    }
  }

  // Meeting-specific cache methods
  async getMeeting(meetingId: string): Promise<any | null> {
    return this.get(`meeting:${meetingId}`, { ttl: 600 }) // 10 minutes
  }

  async setMeeting(meetingId: string, meeting: any): Promise<void> {
    await this.set(`meeting:${meetingId}`, meeting, { ttl: 600 })
  }

  async invalidateMeeting(meetingId: string): Promise<void> {
    await this.del(`meeting:${meetingId}`)
    await this.invalidatePattern(`meeting:${meetingId}:*`)
  }

  // Decision cards cache
  async getDecisionCards(meetingId: string): Promise<any[] | null> {
    return this.get(`decisions:${meetingId}`, { ttl: 300 })
  }

  async setDecisionCards(meetingId: string, decisions: any[]): Promise<void> {
    await this.set(`decisions:${meetingId}`, decisions, { ttl: 300 })
  }

  // Action items cache
  async getActionItems(meetingId: string): Promise<any[] | null> {
    return this.get(`actions:${meetingId}`, { ttl: 300 })
  }

  async setActionItems(meetingId: string, actions: any[]): Promise<void> {
    await this.set(`actions:${meetingId}`, actions, { ttl: 300 })
  }
}

export const cacheService = new CacheService()
