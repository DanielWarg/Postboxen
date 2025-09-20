import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit } from "@/lib/security/rate-limit"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"
import { getDeadLetterQueue } from "@/lib/queues"
import { createLogger } from "@/lib/observability/logger"

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || undefined
  const logger = createLogger(correlationId)

  try {
    await enforceRateLimit(request, { maxRequests: 30 })
    await authenticateRequest(request, ["agent:read"])

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")

    const dlq = getDeadLetterQueue()
    if (!dlq) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "Dead letter queue not available",
      })
    }

    // Get all jobs from DLQ (both waiting and failed)
    const [waitingJobs, failedJobs] = await Promise.all([
      dlq.getWaiting(0, limit),
      dlq.getFailed(0, limit),
    ])

    const allJobs = [...waitingJobs, ...failedJobs]
    
    const formattedJobs = allJobs.map((job: any) => ({
      id: job.id,
      originalJobId: job.data.originalJobId,
      originalQueue: job.data.originalQueue,
      originalData: job.data.originalData,
      failureReason: job.data.failureReason,
      failedAt: job.data.failedAt,
      retryCount: job.data.retryCount,
      canRetry: job.data.canRetry,
      createdAt: job.timestamp,
    }))

    // Sort by most recent first
    const sortedJobs = formattedJobs
      .sort((a, b) => new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime())
      .slice(0, limit)

    logger.info('Dead letter jobs retrieved', { count: sortedJobs.length })
    return NextResponse.json({
      success: true,
      data: sortedJobs,
    })

  } catch (error) {
    if (error instanceof ApiError) {
      logger.warn('Failed to get dead letter jobs', { error: error.message, status: error.statusCode })
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    
    logger.error('Dead letter jobs error', { error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ 
      error: "Internt serverfel" 
    }, { status: 500 })
  }
}
