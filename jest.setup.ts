// Jest setup file
import { jest } from '@jest/globals'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/postboxen_test'
process.env.REDIS_URL = 'redis://localhost:6379/1'
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.JWT_ISSUER = 'postboxen-test'
process.env.JWT_AUDIENCE = 'postboxen-test-clients'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Global test timeout
jest.setTimeout(10000)
