import { NextRequest, NextResponse } from "next/server"

import { ensureAgentBootstrap } from "@/lib/agents/bootstrap"
import { meetingRepository } from "@/lib/db/repositories/meetings"
import { enforceRateLimit } from "@/lib/security/rate-limit"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request)
    await authenticateRequest(request, ["agent:read"])

    ensureAgentBootstrap()
    const meetings = await meetingRepository.getMeetingOverview()
    return NextResponse.json({ meetings })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Fel vid hämtning av möten", error)
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
