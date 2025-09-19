import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { configForPlatform } from "@/lib/agents/config"
import { ensureAgentBootstrap } from "@/lib/agents/bootstrap"
import { createAgent } from "@/lib/agents/orchestrator"
import type { MeetingPlatform } from "@/types/meetings"
import { enforceRateLimit } from "@/lib/security/rate-limit"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"

const requestSchema = z.object({
  platform: z.enum(["microsoft-teams", "zoom", "google-meet", "webex"] as [MeetingPlatform, ...MeetingPlatform[]]),
  meetingId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = requestSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    enforceRateLimit(request)
    await authenticateRequest(request, ["agent:write"])

    const { platform, meetingId } = parsed.data

    ensureAgentBootstrap()
    const agent = createAgent(configForPlatform(platform))
    await agent.cancel(meetingId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Fel vid avbokning", error)
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
