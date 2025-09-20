import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { ensureAgentBootstrap } from "@/lib/agents/bootstrap"
import { meetingRepository } from "@/lib/db/repositories/meetings"
import { enforceRateLimit } from "@/lib/security/rate-limit"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"
import { createLogger } from "@/lib/observability/logger"
import { agentMetrics } from "@/lib/observability/metrics"
import { reportApiError } from "@/lib/observability/sentry"
import { optimizedMeetingQueries, performanceHelpers } from "@/lib/db/optimized-queries"
import { cacheManager } from "@/lib/cache/manager"

const GetMeetingsSchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
  organizerEmail: z.string().email().optional(),
})

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const logger = createLogger(request.headers.get('x-correlation-id') || undefined)
  
  try {
    await enforceRateLimit(request)
    await authenticateRequest(request, ["agent:read"])

    logger.api.request('GET', '/api/agents/meetings')
    ensureAgentBootstrap()
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const { page, limit, organizerEmail } = GetMeetingsSchema.parse(query)

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)

    // Use cached version if available
    const cacheKey = `meetings:page:${pageNum}:limit:${limitNum}:organizer:${organizerEmail || 'all'}`
    const cached = await cacheManager.get(cacheKey)
    
    if (cached) {
      const duration = (Date.now() - startTime) / 1000
      logger.api.response('GET', '/api/agents/meetings', 200, duration)
      agentMetrics.apiRequestsTotal('GET', '/api/agents/meetings', 200)
      agentMetrics.apiRequestDuration('GET', '/api/agents/meetings', duration)
      logger.info('Meetings fetched from cache', { page: pageNum, limit: limitNum })
      return NextResponse.json(cached)
    }

    // Fetch from database with optimized query
    const meetings = await performanceHelpers.trackQuery(
      'getMeetingsPaginated',
      () => optimizedMeetingQueries.getMeetingsPaginated(pageNum, limitNum, organizerEmail)
    )

    // Get total count for pagination
    const totalCount = await performanceHelpers.trackQuery(
      'getMeetingsCount',
      () => optimizedMeetingQueries.getDashboardStats(organizerEmail)
    )

    const result = {
      meetings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount.totalMeetings,
        totalPages: Math.ceil(totalCount.totalMeetings / limitNum),
        hasNext: pageNum * limitNum < totalCount.totalMeetings,
        hasPrev: pageNum > 1,
      },
    }

    // Cache result for 5 minutes
    await cacheManager.set(cacheKey, result, 300)
    
    const duration = (Date.now() - startTime) / 1000
    logger.api.response('GET', '/api/agents/meetings', 200, duration)
    agentMetrics.apiRequestsTotal('GET', '/api/agents/meetings', 200)
    agentMetrics.apiRequestDuration('GET', '/api/agents/meetings', duration)
    
    logger.info('Meetings fetched from database', { 
      page: pageNum, 
      limit: limitNum, 
      count: meetings.length,
      organizerEmail: organizerEmail || 'all'
    })
    
    return NextResponse.json(result)
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
