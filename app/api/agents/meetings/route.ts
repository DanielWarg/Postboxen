import { NextRequest, NextResponse } from "next/server"

import { ensureAgentBootstrap } from "@/lib/agents/bootstrap"
import { meetingRepository } from "@/lib/db/repositories/meetings"
import { enforceRateLimit } from "@/lib/security/rate-limit"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request)
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
