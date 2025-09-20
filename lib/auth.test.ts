import { generateToken, verifyToken, authenticateUser, hashPassword, verifyPassword } from '@/lib/auth'
import { ApiError } from '@/lib/http/errors'

describe('Authentication', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const user = {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['agent:read'],
      }

      const token = generateToken(user)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const user = {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['agent:read'],
      }

      const token = generateToken(user)
      const payload = verifyToken(token)

      expect(payload.userId).toBe(user.id)
      expect(payload.email).toBe(user.email)
      expect(payload.scopes).toEqual(user.scopes)
    })

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyToken('invalid-token')
      }).toThrow(ApiError)
    })

    it('should throw error for expired token', () => {
      // Create a token that expires immediately
      const user = {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['agent:read'],
      }

      const token = generateToken(user)
      
      // Mock Date.now to simulate expiration
      const originalNow = Date.now
      Date.now = jest.fn(() => Date.now() + 25 * 60 * 60 * 1000) // 25 hours later

      expect(() => {
        verifyToken(token)
      }).toThrow(ApiError)

      Date.now = originalNow
    })
  })

  describe('authenticateUser', () => {
    it('should authenticate valid user', async () => {
      const user = await authenticateUser('admin@postboxen.se', 'admin123')
      
      expect(user.id).toBe('admin-user-123')
      expect(user.email).toBe('admin@postboxen.se')
      expect(user.name).toBe('Admin User')
      expect(user.scopes).toContain('admin')
    })

    it('should reject invalid email', async () => {
      await expect(
        authenticateUser('invalid@example.com', 'password')
      ).rejects.toThrow(ApiError)
    })

    it('should reject invalid password', async () => {
      await expect(
        authenticateUser('admin@postboxen.se', 'wrongpassword')
      ).rejects.toThrow(ApiError)
    })
  })

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should generate different hashes for same password', async () => {
      const password = 'testpassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })
  })
})
