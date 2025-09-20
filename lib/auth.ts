import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { env } from "@/lib/config"
import { ApiError } from "@/lib/http/errors"

export interface User {
  id: string
  email: string
  name: string
  scopes: string[]
  createdAt?: string
  lastLogin?: string
}

export interface JWTPayload {
  userId: string
  email: string
  scopes: string[]
  iat?: number
  exp?: number
  iss?: string
  aud?: string
}

// Mock users for development (replace with database in production)
const MOCK_USERS: Record<string, { id: string; email: string; name: string; passwordHash: string; scopes: string[] }> = {
  "admin@postboxen.se": {
    id: "admin-user-123",
    email: "admin@postboxen.se",
    name: "Admin User",
    passwordHash: bcrypt.hashSync("admin123", 10), // Change this in production
    scopes: ["agent:read", "agent:write", "admin"],
  },
  "user@postboxen.se": {
    id: "regular-user-456",
    email: "user@postboxen.se",
    name: "Regular User",
    passwordHash: bcrypt.hashSync("user123", 10), // Change this in production
    scopes: ["agent:read"],
  },
}

// Generate JWT token
export const generateToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    scopes: user.scopes,
  }

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "24h",
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  })
}

// Verify JWT token
export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }) as JWTPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError("Token har upphört att gälla", 401)
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError("Ogiltig token", 401)
    }
    throw new ApiError("Token-verifiering misslyckades", 401)
  }
}

// Authenticate user with email/password
export const authenticateUser = async (email: string, password: string): Promise<User> => {
  const mockUser = MOCK_USERS[email.toLowerCase()]
  if (!mockUser) {
    throw new ApiError("Ogiltiga användaruppgifter", 401)
  }

  const isPasswordValid = await bcrypt.compare(password, mockUser.passwordHash)
  if (!isPasswordValid) {
    throw new ApiError("Ogiltiga användaruppgifter", 401)
  }

  return {
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.name,
    scopes: mockUser.scopes,
    lastLogin: new Date().toISOString(),
  }
}

// Extract token from request
const extractTokenFromRequest = (request: NextRequest): string | null => {
  // Check Authorization header
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  // Check cookies (for browser requests)
  const tokenCookie = request.cookies.get("auth-token")
  if (tokenCookie) {
    return tokenCookie.value
  }

  return null
}

// Main authentication function
export const authenticateRequest = async (
  request: NextRequest,
  requiredScopes: string[] = [],
): Promise<User> => {
  const token = extractTokenFromRequest(request)
  if (!token) {
    throw new ApiError("Autentisering krävs", 401)
  }

  const payload = verifyToken(token)
  
  // Get user details (in production, fetch from database)
  const mockUser = Object.values(MOCK_USERS).find(u => u.id === payload.userId)
  if (!mockUser) {
    throw new ApiError("Användare hittades inte", 401)
  }

  const user: User = {
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.name,
    scopes: payload.scopes,
  }

  // Check if user has required scopes
  const hasRequiredScopes = requiredScopes.every((scope) => user.scopes.includes(scope))
  if (!hasRequiredScopes) {
    throw new ApiError(`Saknar behörighet: ${requiredScopes.join(", ")}`, 403)
  }

  return user
}

// Hash password (for user creation)
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10)
}

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}
