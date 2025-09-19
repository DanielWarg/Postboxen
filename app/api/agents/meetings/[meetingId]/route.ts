import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { ensureAgentBootstrap } from "@/lib/agents/bootstrap"
import { meetingRepository } from "@/lib/db/repositories/meetings"
import { getAuditForMeeting } from "@/lib/agents/compliance"
import { enforceRateLimit } from "@/lib/security/rate-limit"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"

const ParamsSchema = z.object({ meetingId: z.string().min(1) })

export async function GET(
  request: NextRequest,
  context: { params: { meetingId?: string } },
) {
  const parse = ParamsSchema.safeParse(context.params)
  if (!parse.success) {
    return NextResponse.json({ error: "Missing or invalid meetingId" }, { status: 400 })
  }

  const { meetingId } = parse.data

  try {
    enforceRateLimit(request)
    await authenticateRequest(request, ["agent:read"])

    ensureAgentBootstrap()

    const meeting = await meetingRepository.getMeetingDetail(meetingId)
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    const audit = await getAuditForMeeting(meetingId)

    return NextResponse.json(
      {
        meeting: {
          meetingId,
          metadata: meeting.metadata,
          consent: meeting.consent,
          decisions: meeting.decisions,
          actionItems: meeting.actionItems,
          summary: meeting.summary,
          briefs: meeting.briefs,
          stakeholders: meeting.stakeholders,
        },
        audit,
      },
      { status: 200 },
    )
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json(
      {
        error: "Internal error",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
