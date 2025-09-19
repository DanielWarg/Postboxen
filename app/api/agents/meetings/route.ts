import { NextRequest, NextResponse } from "next/server"

import { ensureAgentBootstrap } from "@/lib/agents/bootstrap"
import { getMemoryStore } from "@/lib/agents/memory"
import { enforceRateLimit } from "@/lib/security/rate-limit"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request)
    await authenticateRequest(request, ["agent:read"])

    ensureAgentBootstrap()
    return NextResponse.json({ meetings: getMemoryStore().listMeetings() })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Fel vid hämtning av möten", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
