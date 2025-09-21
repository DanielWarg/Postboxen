import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit } from "@/lib/security/rate-limit"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"
import { getMeetingQueue, getBriefingQueue, getNotificationQueue, getNudgingQueue } from "@/lib/queues"
import { createLogger } from "@/lib/observability/logger"

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || undefined
  const logger = createLogger(correlationId)

  try {
    await enforceRateLimit(request, { maxRequests: 200, windowMs: 15 * 60 * 1000 }) // 200 requests per 15 minutes for dashboard
    await authenticateRequest(request, ["agent:read"])

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "active"
    const limit = parseInt(searchParams.get("limit") || "20")

    const queues = [
      { name: 'meeting-processing', queue: getMeetingQueue() },
      { name: 'briefing', queue: getBriefingQueue() },
      { name: 'notifications', queue: getNotificationQueue() },
      { name: 'nudging', queue: getNudgingQueue() },
    ]

    const allJobs: any[] = []

    // Collect jobs from all queues
    for (const { name, queue } of queues) {
      if (queue) {
        try {
          let jobs: any[] = []
          
          switch (status) {
            case "active":
              jobs = await queue.getActive(0, limit)
              break
            case "waiting":
              jobs = await queue.getWaiting(0, limit)
              break
            case "completed":
              jobs = await queue.getCompleted(0, limit)
              break
            case "failed":
              jobs = await queue.getFailed(0, limit)
              break
            case "delayed":
              jobs = await queue.getDelayed(0, limit)
              break
            default:
              jobs = await queue.getActive(0, limit)
          }

          const formattedJobs = jobs.map((job: any) => ({
            id: job.id,
            queue: name,
            name: job.name,
            data: job.data,
            status: job.finishedOn ? (job.failedReason ? "failed" : "completed") : 
                   job.processedOn ? "active" : 
                   job.delay ? "delayed" : "waiting",
            progress: job.progress,
            attempts: job.attemptsMade || 0,
            maxAttempts: job.opts?.attempts || 3,
            failedReason: job.failedReason,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn,
            delay: job.delay,
            retryCount: job.data?.retryCount || 0,
            idempotencyKey: job.data?.idempotencyKey,
          }))

          allJobs.push(...formattedJobs)
        } catch (error) {
          logger.error('Failed to get jobs from queue', { queueName: name, error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }
    }

    // Sort by most recent first and limit results
    const sortedJobs = allJobs
      .sort((a, b) => (b.processedOn || b.finishedOn || 0) - (a.processedOn || a.finishedOn || 0))
      .slice(0, limit)

    logger.info('Queue jobs retrieved', { status, count: sortedJobs.length })
    return NextResponse.json({
      success: true,
      data: sortedJobs,
    })

  } catch (error) {
    if (error instanceof ApiError) {
      logger.warn('Failed to get queue jobs', { error: error.message, status: error.statusCode })
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    
    logger.error('Queue jobs error', { error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ 
      error: "Internt serverfel" 
    }, { status: 500 })
  }
}
