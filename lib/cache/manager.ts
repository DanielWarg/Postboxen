import { getRedisClient } from '@/lib/redis/client'

// Cache strategies for different data types
export const cacheStrategies = {
  // Meeting data caching
  meeting: {
    ttl: 300, // 5 minutes
    key: (id: string) => `meeting:${id}`,
    invalidateOn: ['meeting:update', 'meeting:delete'],
  },

  // Dashboard stats caching
  dashboard: {
    ttl: 60, // 1 minute
    key: (userId: string) => `dashboard:${userId}`,
    invalidateOn: ['meeting:create', 'meeting:update', 'meeting:delete'],
  },

  // User consent caching
  consent: {
    ttl: 1800, // 30 minutes
    key: (email: string) => `consent:${email}`,
    invalidateOn: ['consent:update'],
  },

  // Queue stats caching
  queues: {
    ttl: 30, // 30 seconds
    key: () => 'queue:stats',
    invalidateOn: ['queue:job:complete', 'queue:job:fail'],
  },

  // API response caching
  api: {
    ttl: 300, // 5 minutes
    key: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
    invalidateOn: ['data:update'],
  },

  // User session caching
  session: {
    ttl: 900, // 15 minutes
    key: (userId: string) => `session:${userId}`,
    invalidateOn: ['user:logout', 'user:update'],
  },
}

// Cache manager with intelligent invalidation
export class CacheManager {
  private redis = getRedisClient()

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      console.warn('Redis not available, cache miss')
      return null
    }
    
    try {
      const cached = await this.redis.get(key)
      if (cached) {
        console.log(`CACHE_HIT: ${key}`)
        return JSON.parse(cached)
      }
      console.log(`CACHE_MISS: ${key}`)
      return null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    if (!this.redis) return
    
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value))
      console.log(`CACHE_SET: ${key} (TTL: ${ttl}s)`)
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redis) return
    
    try {
      await this.redis.del(key)
      console.log(`CACHE_DEL: ${key}`)
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
    }
  }

  async invalidate(pattern: string): Promise<void> {
    if (!this.redis) return
    
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
        console.log(`CACHE_INVALIDATE: ${pattern} (${keys.length} keys)`)
      }
    } catch (error) {
      console.error(`Cache invalidate error for pattern ${pattern}:`, error)
    }
  }

  async invalidateByEvent(event: string): Promise<void> {
    const strategies = Object.values(cacheStrategies)
    const patterns = strategies
      .filter(s => s.invalidateOn.includes(event))
      .map(s => s.key('*'))
    
    for (const pattern of patterns) {
      await this.invalidate(pattern)
    }
  }

  // Cache with automatic strategy application
  async getWithStrategy<T>(strategy: keyof typeof cacheStrategies, ...args: string[]): Promise<T | null> {
    const strategyConfig = cacheStrategies[strategy]
    const key = strategyConfig.key(...args)
    return this.get<T>(key)
  }

  async setWithStrategy<T>(strategy: keyof typeof cacheStrategies, value: T, ...args: string[]): Promise<void> {
    const strategyConfig = cacheStrategies[strategy]
    const key = strategyConfig.key(...args)
    return this.set(key, value, strategyConfig.ttl)
  }

  // Cache warming strategies
  async warmCache(): Promise<void> {
    if (!this.redis) return

    console.log('Starting cache warming...')
    
    try {
      // Warm dashboard stats
      const { optimizedMeetingQueries } = await import('@/lib/db/optimized-queries')
      const stats = await optimizedMeetingQueries.getDashboardStats()
      await this.setWithStrategy('dashboard', stats, 'global')

      // Warm queue stats
      const queueStats = await optimizedMeetingQueries.getQueueStats()
      await this.setWithStrategy('queues', queueStats)

      console.log('Cache warming completed')
    } catch (error) {
      console.error('Cache warming failed:', error)
    }
  }

  // Cache health check
  async getCacheHealth(): Promise<{ status: string; info: any }> {
    if (!this.redis) {
      return { status: 'unavailable', info: { error: 'Redis not available' } }
    }

    try {
      const info = await this.redis.info('memory')
      const keyspace = await this.redis.info('keyspace')
      
      return {
        status: 'healthy',
        info: {
          memory: info,
          keyspace: keyspace,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        info: { error: error instanceof Error ? error.message : 'Unknown error' },
      }
    }
  }
}

// Singleton cache manager instance
export const cacheManager = new CacheManager()

// Cache decorator for functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  strategy: keyof typeof cacheStrategies,
  keyGenerator: (...args: Parameters<T>) => string[]
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: Parameters<T>) {
      const cacheKey = keyGenerator(...args)
      const cached = await cacheManager.getWithStrategy(strategy, ...cacheKey)
      
      if (cached !== null) {
        return cached
      }

      const result = await method.apply(this, args)
      await cacheManager.setWithStrategy(strategy, result, ...cacheKey)
      
      return result
    }
  }
}

// Cache middleware for API routes
export const withCache = <T>(
  strategy: keyof typeof cacheStrategies,
  keyGenerator: (request: Request) => string[]
) => {
  return async (handler: (request: Request) => Promise<T>, request: Request): Promise<T> => {
    const cacheKey = keyGenerator(request)
    const cached = await cacheManager.getWithStrategy(strategy, ...cacheKey)
    
    if (cached !== null) {
      return cached
    }

    const result = await handler(request)
    await cacheManager.setWithStrategy(strategy, result, ...cacheKey)
    
    return result
  }
}

// Cache invalidation helpers
export const cacheInvalidation = {
  // Invalidate meeting-related caches
  invalidateMeeting: async (meetingId: string) => {
    await cacheManager.invalidateByEvent('meeting:update')
    await cacheManager.del(`meeting:${meetingId}`)
  },

  // Invalidate user-related caches
  invalidateUser: async (userEmail: string) => {
    await cacheManager.invalidateByEvent('user:update')
    await cacheManager.del(`consent:${userEmail}`)
    await cacheManager.del(`dashboard:${userEmail}`)
  },

  // Invalidate queue-related caches
  invalidateQueues: async () => {
    await cacheManager.invalidateByEvent('queue:job:complete')
    await cacheManager.del('queue:stats')
  },

  // Invalidate all caches (use with caution)
  invalidateAll: async () => {
    if (cacheManager['redis']) {
      await cacheManager['redis'].flushdb()
      console.log('All caches invalidated')
    }
  },
}

// Performance monitoring for cache
export const cacheMetrics = {
  hits: 0,
  misses: 0,
  
  recordHit: () => { cacheMetrics.hits++ },
  recordMiss: () => { cacheMetrics.misses++ },
  
  getHitRate: () => {
    const total = cacheMetrics.hits + cacheMetrics.misses
    return total > 0 ? (cacheMetrics.hits / total) * 100 : 0
  },
  
  reset: () => {
    cacheMetrics.hits = 0
    cacheMetrics.misses = 0
  },
}
