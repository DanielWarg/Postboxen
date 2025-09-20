import request from 'supertest'
import { NextRequest } from 'next/server'
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { GET as meHandler } from '@/app/api/auth/me/route'
import { POST as logoutHandler } from '@/app/api/auth/logout/route'

// Mock NextRequest for testing
const createMockRequest = (body?: any, headers?: Record<string, string>) => {
  return {
    json: jest.fn().mockResolvedValue(body || {}),
    headers: {
      get: jest.fn((name: string) => headers?.[name.toLowerCase()] || null),
    },
    cookies: {
      get: jest.fn((name: string) => ({ value: headers?.[`cookie-${name}`] })),
    },
  } as unknown as NextRequest
}

describe('Auth API Endpoints', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const mockRequest = createMockRequest({
        email: 'admin@postboxen.se',
        password: 'admin123',
      })

      const response = await loginHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Inloggning lyckades')
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe('admin@postboxen.se')
      expect(data.token).toBeDefined()
    })

    it('should reject invalid credentials', async () => {
      const mockRequest = createMockRequest({
        email: 'admin@postboxen.se',
        password: 'wrongpassword',
      })

      const response = await loginHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeDefined()
    })

    it('should validate input', async () => {
      const mockRequest = createMockRequest({
        email: 'invalid-email',
        password: '',
      })

      const response = await loginHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      // First login to get a token
      const loginRequest = createMockRequest({
        email: 'admin@postboxen.se',
        password: 'admin123',
      })

      const loginResponse = await loginHandler(loginRequest)
      const loginData = await loginResponse.json()
      const token = loginData.token

      // Now test /me endpoint
      const mockRequest = createMockRequest({}, {
        authorization: `Bearer ${token}`,
      })

      const response = await meHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe('admin@postboxen.se')
    })

    it('should reject request without token', async () => {
      const mockRequest = createMockRequest({})

      const response = await meHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeDefined()
    })

    it('should reject request with invalid token', async () => {
      const mockRequest = createMockRequest({}, {
        authorization: 'Bearer invalid-token',
      })

      const response = await meHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeDefined()
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const mockRequest = createMockRequest({})

      const response = await logoutHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Utloggning lyckades')
    })
  })
})
