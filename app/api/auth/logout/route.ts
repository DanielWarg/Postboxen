import { NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/observability/logger"

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || undefined
  const logger = createLogger(correlationId)

  try {
    logger.info('Logout request')

    const response = NextResponse.json(
      { message: "Utloggning lyckades" },
      { status: 200 }
    )

    // Clear the auth cookie
    response.cookies.delete("auth-token")

    return response

  } catch (error) {
    logger.error('Logout error', { error: (error as Error).message, stack: (error as Error).stack })
    return NextResponse.json({ error: "Internt serverfel" }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
