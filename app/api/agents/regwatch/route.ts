import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit } from "@/lib/security/rate-limit"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"
import { scheduleRegwatchJob, executeRegwatchJob, getRegwatchHighlights, triggerRegwatchCheck } from "@/lib/agents/regwatch"
import { z } from "zod"

const ScheduleRegwatchSchema = z.object({
  action: z.enum(["schedule", "execute", "trigger", "highlights"]),
})

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, { maxRequests: 10 })
    await authenticateRequest(request, ["agent:write", "admin"])

    const body = await request.json()
    const { action } = ScheduleRegwatchSchema.parse(body)

    switch (action) {
      case "schedule": {
        const result = await scheduleRegwatchJob()
        
        return NextResponse.json({
          success: true,
          message: "Regwatch schemalagd för daglig kontroll",
          data: result,
        })
      }

      case "execute": {
        const results = await executeRegwatchJob()
        
        return NextResponse.json({
          success: true,
          message: `Regwatch-kontroll utförd. Hittade ändringar i ${results.length} källor`,
          data: {
            sourcesChecked: results.length,
            changesFound: results.reduce((sum, r) => sum + r.changes.length, 0),
            results,
          },
        })
      }

      case "trigger": {
        const results = await triggerRegwatchCheck()
        
        return NextResponse.json({
          success: true,
          message: `Manuell regwatch-kontroll utförd. Hittade ändringar i ${results.length} källor`,
          data: {
            sourcesChecked: results.length,
            changesFound: results.reduce((sum, r) => sum + r.changes.length, 0),
            results,
          },
        })
      }

      default:
        throw new ApiError("Okänd åtgärd", 400)
    }

  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Ogiltig input", 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error("Fel vid regwatch-operation:", error)
    return NextResponse.json({ 
      error: "Internt serverfel" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request)
    await authenticateRequest(request, ["agent:read"])

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || "highlights"
    const limit = parseInt(searchParams.get("limit") || "5")

    switch (action) {
      case "highlights": {
        const highlights = await getRegwatchHighlights(limit)
        
        return NextResponse.json({
          success: true,
          data: highlights,
        })
      }

      case "status": {
        // TODO: Implementera status-hämtning
        return NextResponse.json({
          success: true,
          data: {
            lastCheck: "2024-01-01T00:00:00Z",
            nextCheck: "2024-01-02T02:00:00Z",
            sourcesMonitored: 5,
            changesThisWeek: 0,
          },
        })
      }

      default:
        throw new ApiError("Okänd åtgärd", 400)
    }

  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    
    console.error("Fel vid hämtning av regwatch-data:", error)
    return NextResponse.json({ 
      error: "Internt serverfel" 
    }, { status: 500 })
  }
}