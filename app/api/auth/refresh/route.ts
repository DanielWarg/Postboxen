import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verifyToken, generateToken } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"
import { createLogger } from "@/lib/observability/logger"
import { withSecurity, auditLog } from "@/lib/security/middleware"

const RefreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token krävs"),
})

const refreshHandler = async (request: NextRequest) => {
  const correlationId = request.headers.get('x-correlation-id') || undefined
  const logger = createLogger(correlationId)

  try {
    const body = await request.json()
    const { refreshToken } = RefreshSchema.parse(body)

    // Verify refresh token
    const payload = verifyToken(refreshToken)
    
    if (payload.type !== 'refresh') {
      throw new ApiError("Ogiltig refresh token", 401)
    }

    // Get user details (in production, fetch from database)
    const mockUsers = {
      "admin-user-123": {
        id: "admin-user-123",
        email: "admin@postboxen.se",
        name: "Admin User",
        scopes: ["agent:read", "agent:write", "admin"],
      },
      "regular-user-456": {
        id: "regular-user-456",
        email: "user@postboxen.se",
        name: "Regular User",
        scopes: ["agent:read"],
      },
    }

    const user = mockUsers[payload.userId as keyof typeof mockUsers]
    if (!user) {
      throw new ApiError("Användare hittades inte", 401)
    }

    // Generate new access token
    const newAccessToken = generateToken(user)

    // Audit log token refresh
    auditLog('token_refresh', { userId: user.id }, request)

    logger.info('Token refreshed successfully', { userId: user.id })

    const response = NextResponse.json(
      {
        message: "Token uppdaterad",
        token: newAccessToken,
      },
      { status: 200 }
    )

    // Set new access token cookie
    response.cookies.set("auth-token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    })

    return response

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Refresh token validation error', { errors: error.errors })
      return NextResponse.json(
        { error: "Ogiltiga inmatningsfält", details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof ApiError) {
      logger.warn('Refresh token error', { error: error.message, status: error.statusCode })
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    logger.error('Refresh token internal error', { error: (error as Error).message, stack: (error as Error).stack })
    return NextResponse.json({ error: "Internt serverfel" }, { status: 500 })
  }
}

export const POST = withSecurity(refreshHandler, {
  rateLimit: { maxRequests: 10, windowMs: 900000 }, // 10 attempts per 15 minutes
  maxSize: 512, // 512B max request size
  timeout: 5000, // 5 second timeout
  allowedMethods: ['POST'],
})

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
