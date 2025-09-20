import { NextRequest, NextResponse } from "next/server"

import { ensureAgentBootstrap } from "@/lib/agents/bootstrap"
import { meetingRepository } from "@/lib/db/repositories/meetings"
import { enforceRateLimit } from "@/lib/security/rate-limit"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"
import { createLogger } from "@/lib/observability/logger"
import { agentMetrics } from "@/lib/observability/metrics"
import { reportApiError } from "@/lib/observability/sentry"

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const logger = createLogger(request.headers.get('x-correlation-id') || undefined)
  
  try {
    await enforceRateLimit(request)
    await authenticateRequest(request, ["agent:read"])

    logger.api.request('GET', '/api/agents/meetings')
    ensureAgentBootstrap()
    
    const meetings = await meetingRepository.getMeetingOverview()
    
    const duration = (Date.now() - startTime) / 1000
    logger.api.response('GET', '/api/agents/meetings', 200, duration)
    agentMetrics.apiRequestsTotal('GET', '/api/agents/meetings', 200)
    agentMetrics.apiRequestDuration('GET', '/api/agents/meetings', duration)
    
    return NextResponse.json({ meetings })
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000
    
    if (error instanceof ApiError) {
      logger.api.error('GET', '/api/agents/meetings', error)
      agentMetrics.apiRequestsTotal('GET', '/api/agents/meetings', error.status)
      agentMetrics.apiRequestDuration('GET', '/api/agents/meetings', duration)
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    
    logger.api.error('GET', '/api/agents/meetings', error as Error)
    reportApiError('GET', '/api/agents/meetings', error as Error)
    agentMetrics.apiRequestsTotal('GET', '/api/agents/meetings', 500)
    agentMetrics.apiRequestDuration('GET', '/api/agents/meetings', duration)
    
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, { maxRequests: 10 }) // Stricter limit for POST
    await authenticateRequest(request, ["agent:write"])

    ensureAgentBootstrap()
    const body = await request.json()
    
    const meeting = await meetingRepository.createMeeting(body)
    return NextResponse.json({ meeting }, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Fel vid skapande av möte", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
