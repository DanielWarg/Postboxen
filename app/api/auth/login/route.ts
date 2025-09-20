import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { authenticateUser, generateToken } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"
import { createLogger } from "@/lib/observability/logger"

const LoginSchema = z.object({
  email: z.string().email("Ogiltig e-postadress"),
  password: z.string().min(1, "Lösenord krävs"),
})

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || undefined
  const logger = createLogger(correlationId)

  try {
    const body = await request.json()
    const { email, password } = LoginSchema.parse(body)

    logger.info('Login attempt', { email })

    // Authenticate user
    const user = await authenticateUser(email, password)
    
    // Generate JWT token
    const token = generateToken(user)

    logger.info('Login successful', { userId: user.id, email: user.email })

    const response = NextResponse.json(
      {
        message: "Inloggning lyckades",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          scopes: user.scopes,
        },
        token,
      },
      { status: 200 }
    )

    // Set HTTP-only cookie for browser clients
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
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
      logger.warn('Login authentication error', { error: error.message, status: error.status })
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    logger.error('Login internal error', { error: (error as Error).message, stack: (error as Error).stack })
    return NextResponse.json({ error: "Internt serverfel" }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
