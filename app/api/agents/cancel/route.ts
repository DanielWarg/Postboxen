import { NextResponse } from "next/server"
import { z } from "zod"

import { configForPlatform } from "@/lib/agents/config"
import { ensureAgentBootstrap } from "@/lib/agents/bootstrap"
import { createAgent } from "@/lib/agents/orchestrator"
import type { MeetingPlatform } from "@/types/meetings"

const requestSchema = z.object({
  platform: z.enum(["microsoft-teams", "zoom", "google-meet", "webex"] as [MeetingPlatform, ...MeetingPlatform[]]),
  meetingId: z.string(),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { platform, meetingId } = requestSchema.parse(json)

    ensureAgentBootstrap()
    const agent = createAgent(configForPlatform(platform))
    await agent.cancel(meetingId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Fel vid avbokning", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 })
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
