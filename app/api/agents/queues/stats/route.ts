import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit } from "@/lib/security/rate-limit"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"
import { getMeetingQueue, getBriefingQueue, getNotificationQueue, getNudgingQueue, getDeadLetterQueue } from "@/lib/queues"
import { createLogger } from "@/lib/observability/logger"

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || undefined
  const logger = createLogger(correlationId)

  try {
    await enforceRateLimit(request, { maxRequests: 30 })
    await authenticateRequest(request, ["agent:read"])

    const queues = [
      { name: 'meeting-processing', queue: getMeetingQueue() },
      { name: 'briefing', queue: getBriefingQueue() },
      { name: 'notifications', queue: getNotificationQueue() },
      { name: 'nudging', queue: getNudgingQueue() },
      { name: 'dead-letter', queue: getDeadLetterQueue() },
    ]

    const stats = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      stalled: 0,
    }

    // Aggregate stats from all queues
    for (const { queue } of queues) {
      if (queue) {
        try {
          const queueStats = await queue.getJobCounts()
          stats.waiting += queueStats.waiting || 0
          stats.active += queueStats.active || 0
          stats.completed += queueStats.completed || 0
          stats.failed += queueStats.failed || 0
          stats.delayed += queueStats.delayed || 0
          stats.stalled += queueStats.stalled || 0
        } catch (error) {
          logger.error('Failed to get queue stats', { queueName: queue.name, error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }
    }

    logger.info('Queue stats retrieved', { stats })
    return NextResponse.json({
      success: true,
      data: stats,
    })

  } catch (error) {
    if (error instanceof ApiError) {
      logger.warn('Failed to get queue stats', { error: error.message, status: error.statusCode })
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    
    logger.error('Queue stats error', { error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ 
      error: "Internt serverfel" 
    }, { status: 500 })
  }
}
