import { Queue, Worker, Job } from "bullmq"
import { getRedisClient } from "@/lib/redis/client"
import { processNudgingJob, processNotificationJob as processNudgingNotificationJob, type NudgingJobData, type NotificationJobData } from "@/lib/agents/nudging"

// Job types
export interface MeetingProcessingJob {
  meetingId: string
  transcript?: string
  summary?: any
  decisions?: any[]
  actionItems?: any[]
  idempotencyKey?: string
  retryCount?: number
}

export interface BriefingJob {
  meetingId: string
  type: 'pre' | 'post'
  scheduledTime: Date
  idempotencyKey?: string
  retryCount?: number
}

export interface NotificationJob {
  meetingId: string
  type: 'brief' | 'reminder' | 'summary'
  recipients: string[]
  content: any
  idempotencyKey?: string
  retryCount?: number
}

export interface DeadLetterJob {
  originalJobId: string
  originalQueue: string
  originalData: any
  failureReason: string
  failedAt: Date
  retryCount: number
  canRetry: boolean
}

// Queue instances
let meetingQueue: Queue<MeetingProcessingJob> | null = null
let briefingQueue: Queue<BriefingJob> | null = null
let notificationQueue: Queue<NotificationJob> | null = null
let nudgingQueue: Queue<NudgingJobData> | null = null
let nudgingNotificationQueue: Queue<NotificationJobData> | null = null
let deadLetterQueue: Queue<DeadLetterJob> | null = null

export const getMeetingQueue = () => {
  if (!meetingQueue) {
    const redis = getRedisClient()
    if (!redis) return null
    
    meetingQueue = new Queue<MeetingProcessingJob>('meeting-processing', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
      // DLQ configuration
      settings: {
        stalledInterval: 30 * 1000,
        maxStalledCount: 1,
      },
    })
  }
  return meetingQueue
}

export const getBriefingQueue = () => {
  if (!briefingQueue) {
    const redis = getRedisClient()
    if (!redis) return null
    
    briefingQueue = new Queue<BriefingJob>('briefing', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 20,
        removeOnFail: 10,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      },
      // DLQ configuration
      settings: {
        stalledInterval: 30 * 1000,
        maxStalledCount: 1,
      },
    })
  }
  return briefingQueue
}

export const getNotificationQueue = () => {
  if (!notificationQueue) {
    const redis = getRedisClient()
    if (!redis) return null
    
    notificationQueue = new Queue<NotificationJob>('notifications', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
      // DLQ configuration
      settings: {
        stalledInterval: 30 * 1000,
        maxStalledCount: 1,
      },
    })
  }
  return notificationQueue
}

export const getNudgingQueue = () => {
  if (!nudgingQueue) {
    const redis = getRedisClient()
    if (!redis) return null
    
    nudgingQueue = new Queue<NudgingJobData>('nudging', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
      // DLQ configuration
      settings: {
        stalledInterval: 30 * 1000,
        maxStalledCount: 1,
      },
    })
  }
  return nudgingQueue
}

export const getNudgingNotificationQueue = () => {
  if (!nudgingNotificationQueue) {
    const redis = getRedisClient()
    if (!redis) return null
    
    nudgingNotificationQueue = new Queue<NotificationJobData>('nudging-notifications', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 200,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
      // DLQ configuration
      settings: {
        stalledInterval: 30 * 1000,
        maxStalledCount: 1,
      },
    })
  }
  return nudgingNotificationQueue
}

// Dead Letter Queue
export const getDeadLetterQueue = () => {
  if (!deadLetterQueue) {
    const redis = getRedisClient()
    if (!redis) return null
    
    deadLetterQueue = new Queue<DeadLetterJob>('dead-letter', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 500,
        attempts: 1, // DLQ jobs should not retry
      },
    })
  }
  return deadLetterQueue
}

// Job processors with idempotency and DLQ support
export const processMeetingJob = async (job: Job<MeetingProcessingJob>) => {
  const { meetingId, transcript, summary, decisions, actionItems, idempotencyKey, retryCount = 0 } = job.data
  
  try {
    console.log(`Processing meeting ${meetingId} (attempt ${retryCount + 1})`)
    
    // Check idempotency
    if (idempotencyKey && await checkIdempotency(idempotencyKey)) {
      console.log(`Job ${job.id} already processed (idempotency key: ${idempotencyKey})`)
      return { success: true, meetingId, skipped: true }
    }
    
    // TODO: Implement actual meeting processing logic
    // - Generate AI summary
    // - Extract decisions
    // - Identify action items
    // - Update database
    
    // Mark as processed if idempotency key exists
    if (idempotencyKey) {
      await setIdempotencyKey(idempotencyKey, { meetingId, processedAt: new Date().toISOString() })
    }
    
    return { success: true, meetingId }
  } catch (error) {
    console.error(`Meeting processing failed for ${meetingId}:`, error)
    
    // Send to DLQ if max attempts reached
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      await sendToDeadLetterQueue(job, 'meeting-processing', error as Error)
    }
    
    throw error
  }
}

export const processBriefingJob = async (job: Job<BriefingJob>) => {
  const { meetingId, type, scheduledTime, idempotencyKey, retryCount = 0 } = job.data
  
  try {
    console.log(`Generating ${type} briefing for meeting ${meetingId} (attempt ${retryCount + 1})`)
    
    // Check idempotency
    if (idempotencyKey && await checkIdempotency(idempotencyKey)) {
      console.log(`Briefing job ${job.id} already processed (idempotency key: ${idempotencyKey})`)
      return { success: true, meetingId, type, skipped: true }
    }
    
    // TODO: Implement briefing generation logic with graceful degradation
    // - Generate pre-brief 30 min before meeting
    // - Generate post-brief after meeting
    // - Send via email
    // - If join fails, fall back to post-meeting analysis
    
    // Mark as processed if idempotency key exists
    if (idempotencyKey) {
      await setIdempotencyKey(idempotencyKey, { meetingId, type, processedAt: new Date().toISOString() })
    }
    
    return { success: true, meetingId, type }
  } catch (error) {
    console.error(`Briefing generation failed for ${meetingId}:`, error)
    
    // Send to DLQ if max attempts reached
    if (job.attemptsMade >= (job.opts.attempts || 2)) {
      await sendToDeadLetterQueue(job, 'briefing', error as Error)
    }
    
    throw error
  }
}

export const processNotificationJob = async (job: Job<NotificationJob>) => {
  const { meetingId, type, recipients, content, idempotencyKey, retryCount = 0 } = job.data
  
  try {
    console.log(`Sending ${type} notification for meeting ${meetingId} to ${recipients.length} recipients (attempt ${retryCount + 1})`)
    
    // Check idempotency
    if (idempotencyKey && await checkIdempotency(idempotencyKey)) {
      console.log(`Notification job ${job.id} already processed (idempotency key: ${idempotencyKey})`)
      return { success: true, meetingId, type, recipients: recipients.length, skipped: true }
    }
    
    // TODO: Implement notification logic
    // - Send email notifications
    // - Send Teams/Slack messages
    // - Update meeting status
    
    // Mark as processed if idempotency key exists
    if (idempotencyKey) {
      await setIdempotencyKey(idempotencyKey, { meetingId, type, recipients: recipients.length, processedAt: new Date().toISOString() })
    }
    
    return { success: true, meetingId, type, recipients: recipients.length }
  } catch (error) {
    console.error(`Notification failed for ${meetingId}:`, error)
    
    // Send to DLQ if max attempts reached
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      await sendToDeadLetterQueue(job, 'notifications', error as Error)
    }
    
    throw error
  }
}

// Retention job processing
export const processRetentionJob = async (job: Job<{ meetingId: string; config: any }>) => {
  const { meetingId, config } = job.data
  
  try {
    console.log(`Processing retention job for meeting ${meetingId}`)
    
    // Importera executeRetentionJob från retention.ts
    const { executeRetentionJob } = await import('@/lib/agents/retention')
    
    const result = await executeRetentionJob(meetingId, config)
    
    console.log(`Retention completed for meeting ${meetingId}:`, result)
    
    return { success: true, meetingId, result }
  } catch (error) {
    console.error(`Retention job failed for meeting ${meetingId}:`, error)
    throw error
  }
}

// Dead Letter Queue processor
export const processDeadLetterJob = async (job: Job<DeadLetterJob>) => {
  const { originalJobId, originalQueue, originalData, failureReason, failedAt, retryCount, canRetry } = job.data
  
  console.log(`Processing dead letter job ${originalJobId} from queue ${originalQueue}`)
  console.log(`Failure reason: ${failureReason}`)
  console.log(`Failed at: ${failedAt}`)
  console.log(`Retry count: ${retryCount}`)
  console.log(`Can retry: ${canRetry}`)
  
  // TODO: Implement dead letter handling logic
  // - Log to monitoring system
  // - Send alerts to administrators
  // - Attempt manual recovery if possible
  // - Store for manual review
  
  return { success: true, originalJobId, processed: true }
}

// Idempotency helpers
export const checkIdempotency = async (key: string): Promise<boolean> => {
  const redis = getRedisClient()
  if (!redis) return false
  
  const exists = await redis.exists(`idempotency:${key}`)
  return exists === 1
}

export const setIdempotencyKey = async (key: string, data: any): Promise<void> => {
  const redis = getRedisClient()
  if (!redis) return
  
  // Store idempotency key for 24 hours
  await redis.setex(`idempotency:${key}`, 86400, JSON.stringify(data))
}

export const sendToDeadLetterQueue = async (job: Job<any>, queueName: string, error: Error): Promise<void> => {
  const dlq = getDeadLetterQueue()
  if (!dlq) {
    console.error(`Cannot send job ${job.id} to DLQ: Dead letter queue not available`)
    return
  }
  
  const deadLetterJob: DeadLetterJob = {
    originalJobId: job.id || 'unknown',
    originalQueue: queueName,
    originalData: job.data,
    failureReason: error.message,
    failedAt: new Date(),
    retryCount: job.attemptsMade || 0,
    canRetry: (job.attemptsMade || 0) < 5, // Allow manual retry up to 5 times
  }
  
  try {
    await dlq.add('dead-letter-job', deadLetterJob)
    console.log(`Job ${job.id} sent to dead letter queue`)
  } catch (dlqError) {
    console.error(`Failed to send job ${job.id} to DLQ:`, dlqError)
  }
}

// Queue management
export const startWorkers = () => {
  const redis = getRedisClient()
  if (!redis) {
    console.warn("Redis not available, workers not started")
    return
  }

  // Meeting processing worker
  new Worker<MeetingProcessingJob>('meeting-processing', processMeetingJob, {
    connection: redis,
    concurrency: 2,
  })

  // Briefing worker
  new Worker<BriefingJob>('briefing', processBriefingJob, {
    connection: redis,
    concurrency: 1,
  })

  // Notification worker
  new Worker<NotificationJob>('notifications', processNotificationJob, {
    connection: redis,
    concurrency: 3,
  })

  // Nudging worker
  new Worker<NudgingJobData>('nudging', processNudgingJob, {
    connection: redis,
    concurrency: 2,
  })

  // Nudging notification worker
  new Worker<NotificationJobData>('nudging-notifications', processNudgingNotificationJob, {
    connection: redis,
    concurrency: 5,
  })

  // Retention worker
  new Worker<{ meetingId: string; config: any }>('meeting-processing', processRetentionJob, {
    connection: redis,
    concurrency: 1,
  })

  // Dead Letter Queue worker
  new Worker<DeadLetterJob>('dead-letter', processDeadLetterJob, {
    connection: redis,
    concurrency: 1,
  })

  console.log("Job workers started (with DLQ support)")
}

// Helper functions with idempotency support
export const scheduleBriefing = async (meetingId: string, scheduledTime: Date, type: 'pre' | 'post') => {
  const queue = getBriefingQueue()
  if (!queue) return null

  const idempotencyKey = `briefing_${meetingId}_${type}_${scheduledTime.getTime()}`

  return await queue.add('briefing', {
    meetingId,
    type,
    scheduledTime,
    idempotencyKey,
  }, {
    delay: scheduledTime.getTime() - Date.now(),
    jobId: idempotencyKey, // Use idempotency key as job ID
  })
}

export const queueMeetingProcessing = async (meetingId: string, data: Partial<MeetingProcessingJob>) => {
  const queue = getMeetingQueue()
  if (!queue) return null

  const idempotencyKey = `meeting_${meetingId}_${Date.now()}`

  return await queue.add('meeting-processing', {
    meetingId,
    idempotencyKey,
    ...data,
  }, {
    jobId: idempotencyKey,
  })
}

export const queueNotification = async (meetingId: string, type: 'brief' | 'reminder' | 'summary', recipients: string[], content: any) => {
  const queue = getNotificationQueue()
  if (!queue) return null

  const idempotencyKey = `notification_${meetingId}_${type}_${Date.now()}`

  return await queue.add('notification', {
    meetingId,
    type,
    recipients,
    content,
    idempotencyKey,
  }, {
    jobId: idempotencyKey,
  })
}

export const addRetentionJob = async (meetingId: string, retentionDate: Date, config: any) => {
  const queue = getMeetingQueue()
  if (!queue) return null

  return await queue.add('retention-cleanup', {
    meetingId,
    config,
  }, {
    delay: retentionDate.getTime() - Date.now(),
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  })
}

export const addRegwatchJob = async (scheduledTime: Date) => {
  const queue = getMeetingQueue()
  if (!queue) return null

  return await queue.add('regwatch-check', {
    action: 'check_sources',
  }, {
    delay: scheduledTime.getTime() - Date.now(),
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
}

// Nudging helper functions
export const scheduleNudging = async (
  meetingId: string,
  userId: string,
  userEmail: string,
  nudgingType: "follow_up" | "deadline_reminder" | "action_required" | "meeting_prep",
  delayMs: number = 0,
  config: any = {}
) => {
  const queue = getNudgingQueue()
  if (!queue) return null

  return await queue.add('nudging', {
    meetingId,
    userId,
    userEmail,
    nudgingType,
    config: {
      delay: delayMs,
      maxAttempts: 3,
      priority: 'medium',
      ...config,
    },
  }, {
    delay: delayMs,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
}

export const addNotificationJob = async (
  userId: string,
  recipients: string[],
  type: "email" | "teams" | "slack" | "push",
  template: string,
  data: any
) => {
  const queue = getNudgingNotificationQueue()
  if (!queue) return null

  return await queue.add('notification', {
    userId,
    recipients,
    type,
    template,
    data,
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  })
}
