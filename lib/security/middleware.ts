import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// CORS-konfiguration
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS?.split(',')[0] || 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Correlation-ID',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
}

// Security headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;",
}

// Rate limiting configuration
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export const rateLimit = (maxRequests: number = 100, windowMs: number = 900000) => {
  return (request: NextRequest) => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const key = `${ip}:${Math.floor(now / windowMs)}`
    
    const current = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs }
    
    if (now > current.resetTime) {
      current.count = 0
      current.resetTime = now + windowMs
    }
    
    current.count++
    rateLimitMap.set(key, current)
    
    if (current.count > maxRequests) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: Math.ceil((current.resetTime - now) / 1000) },
        { status: 429, headers: { ...corsHeaders, ...securityHeaders } }
      )
    }
    
    return null
  }
}

// Input validation helpers
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`)
    }
    throw error
  }
}

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

// PII redaction for logging
export const redactPII = (data: any): any => {
  if (typeof data !== 'object' || data === null) return data
  
  const redacted = { ...data }
  const piiFields = ['email', 'password', 'token', 'ssn', 'phone', 'address']
  
  for (const field of piiFields) {
    if (redacted[field]) {
      redacted[field] = '[REDACTED]'
    }
  }
  
  return redacted
}

// Webhook signature verification
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  try {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return false
  }
}

// Request size limiter
export const limitRequestSize = (maxSize: number = 1024 * 1024) => {
  return (request: NextRequest) => {
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413, headers: { ...corsHeaders, ...securityHeaders } }
      )
    }
    return null
  }
}

// Timeout middleware
export const timeout = (ms: number = 30000) => {
  return (request: NextRequest) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), ms)
    
    return {
      signal: controller.signal,
      cleanup: () => clearTimeout(timeoutId)
    }
  }
}

// Security middleware wrapper
export const withSecurity = (
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    rateLimit?: { maxRequests: number; windowMs: number }
    maxSize?: number
    timeout?: number
    requireAuth?: boolean
    allowedMethods?: string[]
  } = {}
) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // CORS preflight
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 200, headers: corsHeaders })
      }
      
      // Method validation
      if (options.allowedMethods && !options.allowedMethods.includes(request.method)) {
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405, headers: { ...corsHeaders, ...securityHeaders } }
        )
      }
      
      // Rate limiting
      if (options.rateLimit) {
        const rateLimitResponse = rateLimit(options.rateLimit.maxRequests, options.rateLimit.windowMs)(request)
        if (rateLimitResponse) return rateLimitResponse
      }
      
      // Request size limiting
      if (options.maxSize) {
        const sizeLimitResponse = limitRequestSize(options.maxSize)(request)
        if (sizeLimitResponse) return sizeLimitResponse
      }
      
      // Timeout
      if (options.timeout) {
        const timeoutConfig = timeout(options.timeout)(request)
        request.signal.addEventListener('abort', () => {
          timeoutConfig.cleanup()
        })
      }
      
      // Execute handler
      const response = await handler(request)
      
      // Add security headers to response
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
      
    } catch (error) {
      console.error('Security middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500, headers: { ...corsHeaders, ...securityHeaders } }
      )
    }
  }
}

// Audit logging
export const auditLog = (action: string, details: any, request: NextRequest) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    correlationId: request.headers.get('x-correlation-id') || 'unknown',
    details: redactPII(details),
  }
  
  console.log('AUDIT:', JSON.stringify(logEntry))
}

// Security utilities
export const securityUtils = {
  corsHeaders,
  securityHeaders,
  rateLimit,
  validateInput,
  sanitizeInput,
  redactPII,
  verifyWebhookSignature,
  limitRequestSize,
  timeout,
  withSecurity,
  auditLog,
}
