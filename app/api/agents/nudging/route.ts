import { NextRequest, NextResponse } from "next/server"
import { scheduleNudging } from "@/lib/queues"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"
import { createLogger } from "@/lib/observability/logger"
import { agentMetrics } from "@/lib/observability/metrics"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const logger = createLogger(request.headers.get('x-correlation-id') || undefined)
  
  try {
    await authenticateRequest(request, ["agent:write"])

    const { 
      meetingId, 
      userId, 
      userEmail, 
      nudgingType, 
      delayMs = 0,
      config = {} 
    } = await request.json()

    if (!meetingId || !userId || !userEmail || !nudgingType) {
      throw new ApiError("Missing required fields: meetingId, userId, userEmail, nudgingType", 400)
    }

    // Validate nudging type
    const validTypes = ["follow_up", "deadline_reminder", "action_required", "meeting_prep"]
    if (!validTypes.includes(nudgingType)) {
      throw new ApiError(`Invalid nudging type. Must be one of: ${validTypes.join(", ")}`, 400)
    }

    logger.info("Scheduling nudging job", {
      meetingId,
      userId,
      nudgingType,
      delayMs,
    })

    const job = await scheduleNudging(
      meetingId,
      userId,
      userEmail,
      nudgingType,
      delayMs,
      config
    )

    if (!job) {
      throw new ApiError("Failed to schedule nudging job - queue not available", 503)
    }

    const duration = (Date.now() - startTime) / 1000
    logger.api.response('POST', '/api/agents/nudging', 201, duration)
    agentMetrics.apiRequestsTotal('POST', '/api/agents/nudging', 201)
    agentMetrics.apiRequestDuration('POST', '/api/agents/nudging', duration)

    return NextResponse.json({
      message: "Nudging job scheduled successfully",
      jobId: job.id,
      meetingId,
      nudgingType,
      scheduledFor: new Date(Date.now() + delayMs).toISOString(),
    }, { status: 201 })

  } catch (error) {
    const duration = (Date.now() - startTime) / 1000
    
    if (error instanceof ApiError) {
      logger.api.error('POST', '/api/agents/nudging', error)
      agentMetrics.apiRequestsTotal('POST', '/api/agents/nudging', error.status)
      agentMetrics.apiRequestDuration('POST', '/api/agents/nudging', duration)
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    
    logger.api.error('POST', '/api/agents/nudging', error as Error)
    agentMetrics.apiRequestsTotal('POST', '/api/agents/nudging', 500)
    agentMetrics.apiRequestDuration('POST', '/api/agents/nudging', duration)
    
    return NextResponse.json({ 
      error: "Failed to schedule nudging job" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const logger = createLogger(request.headers.get('x-correlation-id') || undefined)
  
  try {
    await authenticateRequest(request, ["agent:read"])

    logger.api.request('GET', '/api/agents/nudging')
    
    // In a real implementation, you would fetch job status from the queue
    const mockStatus = {
      activeJobs: 5,
      completedJobs: 150,
      failedJobs: 3,
      queues: {
        nudging: { waiting: 2, active: 1, completed: 75, failed: 1 },
        notifications: { waiting: 3, active: 2, completed: 75, failed: 2 },
      },
    }

    const duration = (Date.now() - startTime) / 1000
    logger.api.response('GET', '/api/agents/nudging', 200, duration)
    agentMetrics.apiRequestsTotal('GET', '/api/agents/nudging', 200)
    agentMetrics.apiRequestDuration('GET', '/api/agents/nudging', duration)

    return NextResponse.json({
      message: "Nudging system status",
      status: mockStatus,
    })

  } catch (error) {
    const duration = (Date.now() - startTime) / 1000
    
    if (error instanceof ApiError) {
      logger.api.error('GET', '/api/agents/nudging', error)
      agentMetrics.apiRequestsTotal('GET', '/api/agents/nudging', error.status)
      agentMetrics.apiRequestDuration('GET', '/api/agents/nudging', duration)
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    
    logger.api.error('GET', '/api/agents/nudging', error as Error)
    agentMetrics.apiRequestsTotal('GET', '/api/agents/nudging', 500)
    agentMetrics.apiRequestDuration('GET', '/api/agents/nudging', duration)
    
    return NextResponse.json({ 
      error: "Failed to get nudging status" 
    }, { status: 500 })
  }
}
