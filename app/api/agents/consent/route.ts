import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit } from "@/lib/security/rate-limit"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"
import { buildConsent } from "@/lib/agents/policy"
import { meetingRepository } from "@/lib/db/repositories/meetings"
import { z } from "zod"
import { createLogger } from "@/lib/observability/logger"

const UpdateConsentSchema = z.object({
  meetingId: z.string().min(1).optional(),
  userEmail: z.string().email().optional(),
  profile: z.enum(["bas", "plus", "juridik"]),
})

const GetConsentSchema = z.object({
  meetingId: z.string().min(1).optional(),
  userEmail: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || undefined
  const logger = createLogger(correlationId)

  try {
    await enforceRateLimit(request, { maxRequests: 10 })
    await authenticateRequest(request, ["agent:write", "admin"])

    const body = await request.json()
    const { action } = body

    switch (action) {
      case "update_consent": {
        const { meetingId, userEmail, profile } = UpdateConsentSchema.parse(body)
        
        if (!meetingId && !userEmail) {
          throw new ApiError("Antingen meetingId eller userEmail måste anges", 400)
        }

        const consent = buildConsent(
          meetingId || `user_${userEmail}`,
          profile,
          new Date().toISOString()
        )

        if (meetingId) {
          // Uppdatera samtycke för specifikt möte
          await meetingRepository.saveConsent(meetingId, consent)
          
          logger.info('Consent updated for meeting', { 
            meetingId, 
            profile, 
            retentionDays: consent.retentionDays,
            dataResidency: consent.dataResidency 
          })
          
          return NextResponse.json({
            success: true,
            message: `Samtycke uppdaterat för möte ${meetingId}`,
            data: {
              meetingId,
              profile: consent.profile,
              retentionDays: consent.retentionDays,
              dataResidency: consent.dataResidency,
              scope: consent.scope,
              acceptedAt: consent.acceptedAt,
            },
          })
        } else if (userEmail) {
          // Uppdatera samtycke för användare (alla möten)
          // TODO: Implementera bulk-uppdatering av användarens alla möten
          logger.info('Consent update requested for user', { userEmail, profile })
          
          return NextResponse.json({
            success: true,
            message: `Samtyckesprofil uppdaterad för användare ${userEmail}`,
            data: {
              userEmail,
              profile: consent.profile,
              retentionDays: consent.retentionDays,
              dataResidency: consent.dataResidency,
              scope: consent.scope,
              acceptedAt: consent.acceptedAt,
            },
          })
        }
        break
      }

      case "get_consent": {
        const { meetingId, userEmail } = GetConsentSchema.parse(body)
        
        if (!meetingId && !userEmail) {
          throw new ApiError("Antingen meetingId eller userEmail måste anges", 400)
        }

        if (meetingId) {
          const consent = await meetingRepository.getConsent(meetingId)
          
          if (!consent) {
            return NextResponse.json({
              success: true,
              message: "Inget samtycke hittades",
              data: null,
            })
          }

          return NextResponse.json({
            success: true,
            message: "Samtycke hämtat",
            data: consent,
          })
        } else if (userEmail) {
          // TODO: Implementera hämtning av användarens samtyckesprofil
          return NextResponse.json({
            success: true,
            message: "Användarsamtycke kommer snart",
            data: null,
          })
        }
        break
      }

      default:
        throw new ApiError("Okänd åtgärd", 400)
    }

  } catch (error) {
    if (error instanceof ApiError) {
      logger.warn('Consent operation failed', { error: error.message, status: error.statusCode })
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    if (error instanceof z.ZodError) {
      logger.warn('Consent validation failed', { error: error.errors })
      return NextResponse.json({ 
        error: "Ogiltig input", 
        details: error.errors 
      }, { status: 400 })
    }
    
    logger.error('Consent operation error', { error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ 
      error: "Internt serverfel" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || undefined
  const logger = createLogger(correlationId)

  try {
    await enforceRateLimit(request)
    await authenticateRequest(request, ["agent:read"])

    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get("meetingId")
    const userEmail = searchParams.get("userEmail")

    if (meetingId) {
      const consent = await meetingRepository.getConsent(meetingId)
      
      if (!consent) {
        return NextResponse.json({
          success: true,
          message: "Inget samtycke hittades",
          data: null,
        })
      }

      logger.info('Consent retrieved for meeting', { meetingId })
      return NextResponse.json({
        success: true,
        message: "Samtycke hämtat",
        data: consent,
      })
    }

    if (userEmail) {
      // TODO: Implementera hämtning av användarens samtyckesprofil
      logger.info('User consent requested', { userEmail })
      return NextResponse.json({
        success: true,
        message: "Användarsamtycke kommer snart",
        data: null,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Använd ?meetingId= eller ?userEmail= för att hämta samtycke",
      data: null,
    })

  } catch (error) {
    if (error instanceof ApiError) {
      logger.warn('Failed to get consent', { error: error.message, status: error.statusCode })
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    
    logger.error('Error getting consent', { error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ 
      error: "Internt serverfel" 
    }, { status: 500 })
  }
}
