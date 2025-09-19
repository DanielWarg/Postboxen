import { NextResponse } from "next/server"

import { ensureAgentBootstrap } from "@/lib/agents/bootstrap"
import { getMemoryStore } from "@/lib/agents/memory"

export async function GET() {
  ensureAgentBootstrap()
  return NextResponse.json({ meetings: getMemoryStore().listMeetings() })
}
