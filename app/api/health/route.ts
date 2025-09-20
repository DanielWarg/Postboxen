import { NextRequest, NextResponse } from "next/server"
import { performanceHelpers } from "@/lib/db/optimized-queries"
import { cacheManager } from "@/lib/cache/manager"
import { getRedisClient } from "@/lib/redis/client"

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check database health
    const databaseHealth = await performanceHelpers.getDatabaseHealth()
    
    // Check cache health
    const cacheHealth = await cacheManager.getCacheHealth()
    
    // Check Redis health
    const redis = getRedisClient()
    let redisHealth = { status: 'unavailable' }
    if (redis) {
      try {
        await redis.ping()
        redisHealth = { status: 'healthy' }
      } catch (error) {
        redisHealth = { status: 'unhealthy' }
      }
    }
    
    // Calculate overall health
    const isHealthy = databaseHealth.status === 'healthy' && 
                     cacheHealth.status === 'healthy' && 
                     redisHealth.status === 'healthy'
    
    const responseTime = Date.now() - startTime
    
    const healthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      components: {
        database: databaseHealth,
        cache: cacheHealth,
        redis: redisHealth,
      },
    }
    
    return NextResponse.json(healthStatus, { 
      status: isHealthy ? 200 : 503 
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 })
  }
}
