import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { env } from "@/lib/config"
import { ApiError } from "@/lib/http/errors"
import { createLogger } from "@/lib/observability/logger"
import { redactPII } from "@/lib/security/middleware"

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

// User schema validation
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  scopes: z.array(z.string()),
  createdAt: z.string().optional(),
  lastLogin: z.string().optional(),
  failedLoginAttempts: z.number().default(0),
  lockedUntil: z.string().optional(),
})

// Login attempt tracking
const loginAttempts = new Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }>()

// Mock users for development (replace with database in production)
const MOCK_USERS: Record<string, { 
  id: string
  email: string
  name: string
  passwordHash: string
  scopes: string[]
  failedLoginAttempts: number
  lockedUntil?: Date
}> = {
  "admin@postboxen.se": {
    id: "admin-user-123",
    email: "admin@postboxen.se",
    name: "Admin User",
    passwordHash: bcrypt.hashSync("admin123", 10), // Change this in production
    scopes: ["agent:read", "agent:write", "admin"],
    failedLoginAttempts: 0,
  },
  "user@postboxen.se": {
    id: "regular-user-456",
    email: "user@postboxen.se",
    name: "Regular User",
    passwordHash: bcrypt.hashSync("user123", 10), // Change this in production
    scopes: ["agent:read"],
    failedLoginAttempts: 0,
  },
}

// Generate JWT token with shorter expiration for security
export const generateToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    scopes: user.scopes,
  }

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "15m", // Shorter expiration for security
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  })
}

// Generate refresh token
export const generateRefreshToken = (user: User): string => {
  const payload = {
    userId: user.id,
    type: 'refresh',
  }

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d", // Longer expiration for refresh token
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

// Check if account is locked
const isAccountLocked = (email: string): boolean => {
  const attempts = loginAttempts.get(email.toLowerCase())
  if (!attempts) return false
  
  if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
    return true
  }
  
  // Clear lock if expired
  if (attempts.lockedUntil && attempts.lockedUntil <= new Date()) {
    loginAttempts.delete(email.toLowerCase())
  }
  
  return false
}

// Record failed login attempt
const recordFailedAttempt = (email: string): void => {
  const attempts = loginAttempts.get(email.toLowerCase()) || { count: 0, lastAttempt: new Date() }
  attempts.count++
  attempts.lastAttempt = new Date()
  
  // Lock account after 5 failed attempts for 15 minutes
  if (attempts.count >= 5) {
    attempts.lockedUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  }
  
  loginAttempts.set(email.toLowerCase(), attempts)
}

// Clear failed attempts on successful login
const clearFailedAttempts = (email: string): void => {
  loginAttempts.delete(email.toLowerCase())
}

// Authenticate user with email/password and security checks
export const authenticateUser = async (email: string, password: string, request: NextRequest): Promise<User> => {
  const logger = createLogger(request.headers.get('x-correlation-id'))
  const normalizedEmail = email.toLowerCase()
  
  // Check if account is locked
  if (isAccountLocked(normalizedEmail)) {
    logger.warn('Login attempt on locked account', { email: redactPII({ email: normalizedEmail }) })
    throw new ApiError("Kontot är tillfälligt låst på grund av för många misslyckade inloggningsförsök", 423)
  }
  
  const mockUser = MOCK_USERS[normalizedEmail]
  if (!mockUser) {
    logger.warn('Login attempt with unknown email', { email: redactPII({ email: normalizedEmail }) })
    throw new ApiError("Ogiltiga användaruppgifter", 401)
  }

  const isPasswordValid = await bcrypt.compare(password, mockUser.passwordHash)
  if (!isPasswordValid) {
    recordFailedAttempt(normalizedEmail)
    logger.warn('Failed login attempt', { email: redactPII({ email: normalizedEmail }) })
    throw new ApiError("Ogiltiga användaruppgifter", 401)
  }

  // Clear failed attempts on successful login
  clearFailedAttempts(normalizedEmail)
  
  logger.info('Successful login', { userId: mockUser.id, email: redactPII({ email: normalizedEmail }) })
  
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
