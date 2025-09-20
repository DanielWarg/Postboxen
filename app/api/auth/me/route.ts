import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"
import { createLogger } from "@/lib/observability/logger"

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || undefined
  const logger = createLogger(correlationId)

  try {
    // Authenticate the request
    const user = await authenticateRequest(request)

    logger.info('User info retrieved', { userId: user.id })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          scopes: user.scopes,
          lastLogin: user.lastLogin,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    if (error instanceof ApiError) {
      logger.warn('Authentication error', { error: error.message, status: error.status })
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    logger.error('User info error', { error: (error as Error).message, stack: (error as Error).stack })
    return NextResponse.json({ error: "Internt serverfel" }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
