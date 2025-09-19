import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { ensureAgentBootstrap } from "@/lib/agents/bootstrap"
import { documentCopilot } from "@/lib/modules/documents/copilot"
import { enforceRateLimit } from "@/lib/security/rate-limit"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"

const bodySchema = z.object({
  meetingId: z.string(),
  title: z.string().min(3),
  currentVersion: z.string().min(50),
  proposedChanges: z.string().min(1),
  persona: z.string().optional(),
  documentType: z.enum(["contract", "procurement", "policy", "other"]).optional(),
  references: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parse = bodySchema.safeParse(json)
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
    }

    enforceRateLimit(request)
    await authenticateRequest(request, ["agent:write"])

    ensureAgentBootstrap()

    const suggestion = await documentCopilot.analyze(parse.data)

    return NextResponse.json(suggestion, { status: 200 })
  } catch (error) {
    console.error("Doc copilot API error", error)
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json(
      {
        error: "Det gick inte att analysera dokumentet just nu.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
