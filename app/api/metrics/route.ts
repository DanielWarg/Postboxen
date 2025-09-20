import { NextRequest, NextResponse } from "next/server"
import { metricsHandler } from "@/lib/observability/metrics"
import { enforceRateLimit } from "@/lib/security/rate-limit"
import { authenticateRequest } from "@/lib/auth"
import { ApiError } from "@/lib/http/errors"

export async function GET(request: NextRequest) {
  try {
    // Metrics endpoint should have more lenient rate limiting for dashboard
    await enforceRateLimit(request, { maxRequests: 60, windowMs: 60000 }) // 60 req/min instead of 10
    await authenticateRequest(request, ["admin"]) // Only admins can access metrics

    // Create a mock response object
    const mockRes = {
      setHeader: (key: string, value: string) => {},
      status: (code: number) => ({
        send: (data: string) => data
      })
    }

    const metricsData = metricsHandler(request, mockRes)
    
    return new NextResponse(metricsData, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    
    console.error("Fel vid hämtning av metrics:", error)
    return NextResponse.json({ 
      error: "Internt serverfel" 
    }, { status: 500 })
  }
}
