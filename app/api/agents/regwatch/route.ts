import { NextRequest, NextResponse } from "next/server"

import { ensureAgentBootstrap } from "@/lib/agents/bootstrap"
import { regulationWatcher } from "@/lib/modules/regwatch"
import { enforceRateLimit } from "@/lib/security/rate-limit"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request)
    await authenticateRequest(request, ["agent:read"])

    ensureAgentBootstrap()
    const results = await regulationWatcher.run()
    return NextResponse.json({ sources: results }, { status: 200 })
  } catch (error) {
    console.error("Regwatch API error", error)
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json(
      {
        error: "Misslyckades med att hämta regelförändringar",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
