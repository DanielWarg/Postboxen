import { env } from '@/lib/config'

// Simple Sentry-like error reporting (avoid browser issues)
export const reportError = (error: Error, context?: any) => {
  console.error('Error reported:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  })
}

export const reportMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info', context?: any) => {
  console.log(`[${level.toUpperCase()}] ${message}`, context)
}

// Meeting-specific error reporting
export const reportMeetingError = (meetingId: string, error: Error, context?: any) => {
  reportError(error, { meetingId, type: 'meeting_error', ...context })
}

// API-specific error reporting
export const reportApiError = (method: string, url: string, error: Error, context?: any) => {
  reportError(error, { method, url, type: 'api_error', ...context })
}

// Agent-specific error reporting
export const reportAgentError = (agentType: string, meetingId: string, error: Error, context?: any) => {
  reportError(error, { agentType, meetingId, type: 'agent_error', ...context })
}

// Performance monitoring (placeholder)
export const startTransaction = (name: string, op: string) => {
  const startTime = Date.now()
  return {
    name,
    op,
    startTime,
    finish: () => {
      const duration = Date.now() - startTime
      console.log(`Transaction ${name} (${op}) completed in ${duration}ms`)
    }
  }
}

export const addBreadcrumb = (message: string, category: string, level: 'info' | 'warning' | 'error' = 'info', data?: any) => {
  console.log(`[BREADCRUMB] ${category}: ${message}`, { level, data })
}

// User context (placeholder)
export const setUserContext = (user: { id: string; email: string; [key: string]: any }) => {
  console.log('User context set:', user)
}

// Custom metrics (placeholder)
export const recordMetric = (name: string, value: number, unit: string = 'none') => {
  console.log(`Metric ${name}: ${value} ${unit}`)
}

// Default export
export default {
  reportError,
  reportMessage,
  reportMeetingError,
  reportApiError,
  reportAgentError,
  startTransaction,
  addBreadcrumb,
  setUserContext,
  recordMetric,
}
