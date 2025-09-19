import { NextResponse } from "next/server"

import { ensureAgentBootstrap } from "@/lib/agents/bootstrap"
import { regulationWatcher } from "@/lib/modules/regwatch"

export async function GET() {
  try {
    ensureAgentBootstrap()
    const results = await regulationWatcher.run()
    return NextResponse.json({ sources: results }, { status: 200 })
  } catch (error) {
    console.error("Regwatch API error", error)
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
