import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"
import { createLogger } from "@/lib/observability/logger"
import { withSecurity } from "@/lib/security/middleware"
import { performanceHelpers } from "@/lib/db/optimized-queries"
import { cacheManager } from "@/lib/cache/manager"
import { getRedisClient } from "@/lib/redis/client"
import { getMeetingQueue, getBriefingQueue, getNotificationQueue, getNudgingQueue, getDeadLetterQueue } from "@/lib/queues"

const performanceHandler = async (request: NextRequest) => {
  const correlationId = request.headers.get('x-correlation-id') || undefined
  const logger = createLogger(correlationId)

  try {
    await authenticateRequest(request, ["admin"]) // Only admin can view performance metrics

    logger.info('Performance metrics requested')

    // Get database health
    const databaseHealth = await performanceHelpers.getDatabaseHealth()

    // Get cache health
    const cacheHealth = await cacheManager.getCacheHealth()

    // Get Redis health
    const redis = getRedisClient()
    let redisHealth = { status: 'unavailable', info: { error: 'Redis not available' } }
    if (redis) {
      try {
        const info = await redis.info('memory')
        const keyspace = await redis.info('keyspace')
        redisHealth = {
          status: 'healthy',
          info: {
            memory: info,
            keyspace: keyspace,
            timestamp: new Date().toISOString(),
          },
        }
      } catch (error) {
        redisHealth = {
          status: 'unhealthy',
          info: { error: error instanceof Error ? error.message : 'Unknown error' },
        }
      }
    }

    // Get queue health
    const queueHealth = await Promise.allSettled([
      getMeetingQueue()?.getJobCounts(),
      getBriefingQueue()?.getJobCounts(),
      getNotificationQueue()?.getJobCounts(),
      getNudgingQueue()?.getJobCounts(),
      getDeadLetterQueue()?.getJobCounts(),
    ])

    const queueStats = {
      meetingProcessing: queueHealth[0].status === 'fulfilled' ? queueHealth[0].value : null,
      briefing: queueHealth[1].status === 'fulfilled' ? queueHealth[1].value : null,
      notifications: queueHealth[2].status === 'fulfilled' ? queueHealth[2].value : null,
      nudging: queueHealth[3].status === 'fulfilled' ? queueHealth[3].value : null,
      deadLetter: queueHealth[4].status === 'fulfilled' ? queueHealth[4].value : null,
    }

    // Calculate overall health score
    const healthScore = calculateHealthScore({
      database: databaseHealth.status === 'healthy' ? 100 : 0,
      cache: cacheHealth.status === 'healthy' ? 100 : 0,
      redis: redisHealth.status === 'healthy' ? 100 : 0,
      queues: Object.values(queueStats).every(q => q !== null) ? 100 : 0,
    })

    const metrics = {
      timestamp: new Date().toISOString(),
      healthScore,
      components: {
        database: databaseHealth,
        cache: cacheHealth,
        redis: redisHealth,
        queues: queueStats,
      },
      performance: {
        databaseResponseTime: databaseHealth.responseTime || 0,
        cacheHitRate: await getCacheHitRate(),
        queueBacklog: calculateQueueBacklog(queueStats),
      },
    }

    logger.info('Performance metrics generated', { healthScore })
    return NextResponse.json({ success: true, data: metrics }, { status: 200 })

  } catch (error) {
    if (error instanceof ApiError) {
      logger.warn('Failed to get performance metrics', { error: error.message, status: error.statusCode })
      return NextResponse.json({ message: error.message }, { status: error.statusCode })
    }
    logger.error('Performance metrics error', { error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ message: "Ett oväntat fel uppstod vid hämtning av performance metrics" }, { status: 500 })
  }
}

// Helper functions
function calculateHealthScore(scores: Record<string, number>): number {
  const values = Object.values(scores)
  return Math.round(values.reduce((sum, score) => sum + score, 0) / values.length)
}

async function getCacheHitRate(): Promise<number> {
  // This would be implemented with actual cache metrics
  // For now, return a mock value
  return 85.5
}

function calculateQueueBacklog(queueStats: any): number {
  let totalBacklog = 0
  Object.values(queueStats).forEach((stats: any) => {
    if (stats) {
      totalBacklog += (stats.waiting || 0) + (stats.active || 0) + (stats.delayed || 0)
    }
  })
  return totalBacklog
}

export const GET = withSecurity(performanceHandler, {
  rateLimit: { maxRequests: 20, windowMs: 60000 }, // 20 requests per minute
  maxSize: 1024, // 1KB max request size
  timeout: 10000, // 10 second timeout
  allowedMethods: ['GET'],
})

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
