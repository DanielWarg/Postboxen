import { v4 as uuidv4 } from 'uuid'
import { env } from '@/lib/config'

// Simple console logger for now (avoid Winston browser issues)
const logFormat = (level: string, message: string, meta?: any) => {
  const timestamp = new Date().toISOString()
  return JSON.stringify({
    timestamp,
    level,
    message,
    service: 'postboxen-agents',
    environment: env.NODE_ENV || 'development',
    ...meta,
  })
}

// Create logger instance
const logger = {
  level: env.LOG_LEVEL || 'info',
  
  info: (message: string, meta?: any) => {
    console.log(logFormat('info', message, meta))
  },
  
  warn: (message: string, meta?: any) => {
    console.warn(logFormat('warn', message, meta))
  },
  
  error: (message: string, meta?: any) => {
    console.error(logFormat('error', message, meta))
  },
  
  debug: (message: string, meta?: any) => {
    if (logger.level === 'debug') {
      console.debug(logFormat('debug', message, meta))
    }
  },
}

// Add correlation ID to all logs
const addCorrelationId = (correlationId?: string) => {
  return logger.child({ correlationId: correlationId || uuidv4() })
}

// Structured logging methods
export const createLogger = (correlationId?: string) => {
  const loggerWithId = {
    ...logger,
    child: (meta: any) => ({
      ...logger,
      info: (message: string, extraMeta?: any) => logger.info(message, { ...meta, ...extraMeta }),
      warn: (message: string, extraMeta?: any) => logger.warn(message, { ...meta, ...extraMeta }),
      error: (message: string, extraMeta?: any) => logger.error(message, { ...meta, ...extraMeta }),
      debug: (message: string, extraMeta?: any) => logger.debug(message, { ...meta, ...extraMeta }),
    })
  }
  
  return {
    info: (message: string, meta?: any) => loggerWithId.info(message, { correlationId, ...meta }),
    warn: (message: string, meta?: any) => loggerWithId.warn(message, { correlationId, ...meta }),
    error: (message: string, meta?: any) => loggerWithId.error(message, { correlationId, ...meta }),
    debug: (message: string, meta?: any) => loggerWithId.debug(message, { correlationId, ...meta }),
    
    // Meeting-specific logging
    meeting: {
      started: (meetingId: string, meta?: any) => 
        loggerWithId.info('Meeting started', { meetingId, event: 'meeting_started', ...meta }),
      ended: (meetingId: string, meta?: any) => 
        loggerWithId.info('Meeting ended', { meetingId, event: 'meeting_ended', ...meta }),
      decision: (meetingId: string, decisionId: string, meta?: any) => 
        loggerWithId.info('Decision recorded', { meetingId, decisionId, event: 'decision_recorded', ...meta }),
      action: (meetingId: string, actionId: string, meta?: any) => 
        loggerWithId.info('Action item created', { meetingId, actionId, event: 'action_created', ...meta }),
    },
    
    // API-specific logging
    api: {
      request: (method: string, url: string, meta?: any) => 
        loggerWithId.info('API request', { method, url, event: 'api_request', ...meta }),
      response: (method: string, url: string, statusCode: number, duration: number, meta?: any) => 
        loggerWithId.info('API response', { method, url, statusCode, duration, event: 'api_response', ...meta }),
      error: (method: string, url: string, error: Error, meta?: any) => 
        loggerWithId.error('API error', { method, url, error: error.message, stack: error.stack, event: 'api_error', ...meta }),
    },
    
    // Agent-specific logging
    agent: {
      processing: (agentType: string, meetingId: string, meta?: any) => 
        loggerWithId.info('Agent processing', { agentType, meetingId, event: 'agent_processing', ...meta }),
      completed: (agentType: string, meetingId: string, meta?: any) => 
        loggerWithId.info('Agent completed', { agentType, meetingId, event: 'agent_completed', ...meta }),
      error: (agentType: string, meetingId: string, error: Error, meta?: any) => 
        loggerWithId.error('Agent error', { agentType, meetingId, error: error.message, stack: error.stack, event: 'agent_error', ...meta }),
    },
    
    // Retention-specific logging
    retention: {
      scheduled: (meetingId: string, profile: string, retentionDays: number, meta?: any) => 
        loggerWithId.info('Retention scheduled', { meetingId, profile, retentionDays, event: 'retention_scheduled', ...meta }),
      executed: (meetingId: string, deletedRecords: any, auditHash: string, meta?: any) => 
        loggerWithId.info('Retention executed', { meetingId, deletedRecords, auditHash, event: 'retention_executed', ...meta }),
      error: (meetingId: string, error: Error, meta?: any) => 
        loggerWithId.error('Retention error', { meetingId, error: error.message, stack: error.stack, event: 'retention_error', ...meta }),
    },
    
    // Regwatch-specific logging
    regwatch: {
      checkStarted: (sources: string[], meta?: any) => 
        loggerWithId.info('Regwatch check started', { sources, event: 'regwatch_check_started', ...meta }),
      checkCompleted: (sourcesChecked: number, changesFound: number, meta?: any) => 
        loggerWithId.info('Regwatch check completed', { sourcesChecked, changesFound, event: 'regwatch_check_completed', ...meta }),
      changeDetected: (source: string, changes: number, meta?: any) => 
        loggerWithId.warn('Regulatory change detected', { source, changes, event: 'regulatory_change_detected', ...meta }),
      error: (source: string, error: Error, meta?: any) => 
        loggerWithId.error('Regwatch error', { source, error: error.message, stack: error.stack, event: 'regwatch_error', ...meta }),
    },
  }
}

// Default logger instance
export const defaultLogger = createLogger()

// Export the base logger for direct use
export { logger }

// Middleware for adding correlation ID to requests
export const correlationIdMiddleware = (req: any, res: any, next: any) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4()
  req.correlationId = correlationId
  res.setHeader('x-correlation-id', correlationId)
  next()
}
