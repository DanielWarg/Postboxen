import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit } from "@/lib/security/rate-limit"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"
import { scheduleRetentionJob, executeRetentionJob, deleteAllDataForUser } from "@/lib/agents/retention"
import { z } from "zod"

const ScheduleRetentionSchema = z.object({
  meetingId: z.string().min(1),
  profile: z.enum(["bas", "plus", "juridik"]),
})

const DeleteAllSchema = z.object({
  userEmail: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, { maxRequests: 5 }) // Stricter limit for retention operations
    await authenticateRequest(request, ["agent:write", "admin"])

    const body = await request.json()
    const { action } = body

    switch (action) {
      case "schedule_retention": {
        const { meetingId, profile } = ScheduleRetentionSchema.parse(body)
        
        const result = await scheduleRetentionJob(meetingId, profile)
        
        return NextResponse.json({
          success: true,
          message: `Retention schemalagd för möte ${meetingId}`,
          data: result,
        })
      }

      case "execute_retention": {
        const { meetingId, profile } = ScheduleRetentionSchema.parse(body)
        
        const config = {
          profile: profile as "bas" | "plus" | "juridik",
          retentionDays: profile === "bas" ? 30 : profile === "plus" ? 90 : 365,
          dataResidency: profile === "juridik" ? "customer" as const : "eu" as const,
        }
        
        const result = await executeRetentionJob(meetingId, config)
        
        return NextResponse.json({
          success: true,
          message: `Retention utförd för möte ${meetingId}`,
          data: result,
        })
      }

      case "delete_all": {
        const { userEmail } = DeleteAllSchema.parse(body)
        
        const result = await deleteAllDataForUser(userEmail)
        
        return NextResponse.json({
          success: true,
          message: `All data raderad för användare ${userEmail}`,
          data: result,
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
    
    console.error("Fel vid retention-operation:", error)
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
    const meetingId = searchParams.get("meetingId")
    const userEmail = searchParams.get("userEmail")

    if (meetingId) {
      // Hämta retention-status för specifikt möte
      // TODO: Implementera status-hämtning
      return NextResponse.json({
        meetingId,
        status: "unknown",
        message: "Retention-status kommer snart",
      })
    }

    if (userEmail) {
      // Hämta retention-status för användare
      // TODO: Implementera användarstatus-hämtning
      return NextResponse.json({
        userEmail,
        status: "unknown", 
        message: "Användarstatus kommer snart",
      })
    }

    return NextResponse.json({
      message: "Använd ?meetingId= eller ?userEmail= för att hämta status",
    })

  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    
    console.error("Fel vid hämtning av retention-status:", error)
    return NextResponse.json({ 
      error: "Internt serverfel" 
    }, { status: 500 })
  }
}
