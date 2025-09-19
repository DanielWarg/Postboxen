import { jwtVerify } from "jose"
import type { JWTPayload } from "jose"

import { env } from "@/lib/config"
import { ApiError } from "@/lib/http/errors"

const encoder = new TextEncoder()
const secretKey = encoder.encode(env.JWT_SECRET)

export interface AuthContext {
  subject: string
  roles: string[]
  payload: JWTPayload
}

const parseRoles = (payload: JWTPayload): string[] => {
  const roles = payload.roles ?? payload["https://postboxen.ai/roles"]
  if (Array.isArray(roles)) return roles.map(String)
  if (typeof roles === "string") return roles.split(",").map((role) => role.trim())
  return []
}

export const authenticateRequest = async (
  request: Request,
  requiredRoles: string[] = [],
): Promise<AuthContext> => {
  const header = request.headers.get("authorization") || request.headers.get("Authorization")
  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "Saknar Authorization-header")
  }

  const token = header.replace("Bearer ", "").trim()
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    })

    const roles = parseRoles(payload)
    if (requiredRoles.length && !requiredRoles.some((role) => roles.includes(role))) {
      throw new ApiError(403, "Behörighet saknas för denna åtgärd")
    }

    return {
      subject: typeof payload.sub === "string" ? payload.sub : "",
      roles,
      payload,
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(401, "Ogiltig eller utgången token")
  }
}
