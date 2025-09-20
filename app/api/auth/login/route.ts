import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { authenticateUser, generateToken, generateRefreshToken } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"
import { createLogger } from "@/lib/observability/logger"
import { withSecurity, auditLog } from "@/lib/security/middleware"

const LoginSchema = z.object({
  email: z.string().email("Ogiltig e-postadress"),
  password: z.string().min(1, "Lösenord krävs"),
})

const loginHandler = async (request: NextRequest) => {
  const correlationId = request.headers.get('x-correlation-id') || undefined
  const logger = createLogger(correlationId)

  try {
    const body = await request.json()
    const { email, password } = LoginSchema.parse(body)

    // Authenticate user with security checks
    const user = await authenticateUser(email, password, request)

    // Generate tokens
    const accessToken = generateToken(user)
    const refreshToken = generateRefreshToken(user)

    // Audit log successful login
    auditLog('user_login', { userId: user.id, email: user.email }, request)

    logger.info('Login successful', { userId: user.id })

    const response = NextResponse.json(
      {
        message: "Inloggning lyckades",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          scopes: user.scopes,
        },
        token: accessToken, // For API clients
      },
      { status: 200 }
    )

    // Set secure HTTP-only cookies
    response.cookies.set("auth-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    })

    response.cookies.set("refresh-token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Login validation error', { errors: error.errors })
      return NextResponse.json(
        { error: "Ogiltiga inmatningsfält", details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof ApiError) {
      logger.warn('Login authentication error', { error: error.message, status: error.statusCode })
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    logger.error('Login internal error', { error: (error as Error).message, stack: (error as Error).stack })
    return NextResponse.json({ error: "Internt serverfel" }, { status: 500 })
  }
}

export const POST = withSecurity(loginHandler, {
  rateLimit: { maxRequests: 5, windowMs: 900000 }, // 5 attempts per 15 minutes
  maxSize: 1024, // 1KB max request size
  timeout: 10000, // 10 second timeout
  allowedMethods: ['POST'],
})

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
