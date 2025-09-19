import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { configForPlatform } from "@/lib/agents/config"
import { ensureAgentBootstrap } from "@/lib/agents/bootstrap"
import { createAgent } from "@/lib/agents/orchestrator"
import { consentReceipt } from "@/lib/agents/compliance"
import type { MeetingPlatform } from "@/types/meetings"

const requestSchema = z.object({
  platform: z.enum(["microsoft-teams", "zoom", "google-meet", "webex"] as [MeetingPlatform, ...MeetingPlatform[]]),
  meeting: z.object({
    meetingId: z.string(),
    title: z.string(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    joinUrl: z.string().url(),
    organizerEmail: z.string().email(),
    attendees: z.array(z.string().email()),
    agenda: z.string().optional(),
    persona: z.string().optional(),
    language: z.string().optional(),
    recordingConsent: z.boolean().optional(),
    consentProfile: z.enum(["bas", "plus", "juridik"]).optional(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parse = requestSchema.safeParse(json)
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
    }

    const { platform, meeting } = parse.data

    ensureAgentBootstrap()

    const config = configForPlatform(platform)
    if (meeting.persona) {
      config.persona = meeting.persona
    }
    if (meeting.language) {
      config.locale = meeting.language
    }

    const agent = createAgent(config)
    const response = await agent.schedule(meeting)

    return NextResponse.json({
      success: true,
      externalMeetingId: response.externalId,
      consent: response.consent
        ? consentReceipt(meeting.meetingId, response.consent)
        : undefined,
    }, { status: 201 })
  } catch (error) {
    console.error("Fel vid schemaläggning", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function OPTIONS() {
    return NextResponse.json({}, { status: 200 })
}
