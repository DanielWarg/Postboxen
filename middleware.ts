import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { env } from "@/lib/config"

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const origin = request.headers.get("origin") ?? ""

  if (env.ALLOWED_ORIGINS_LIST.includes("*") || env.ALLOWED_ORIGINS_LIST.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", env.ALLOWED_ORIGINS_LIST.includes("*") ? "*" : origin)
    response.headers.set("Vary", "Origin")
  }

  response.headers.set("Access-Control-Allow-Credentials", "true")
  response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type")
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: response.headers })
  }

  return response
}

export const config = {
  matcher: ["/api/:path*"],
}
