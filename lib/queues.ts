import { Queue, Worker, Job } from "bullmq"
import { getRedisClient } from "@/lib/redis/client"

// Job types
export interface MeetingProcessingJob {
  meetingId: string
  transcript?: string
  summary?: any
  decisions?: any[]
  actionItems?: any[]
}

export interface BriefingJob {
  meetingId: string
  type: 'pre' | 'post'
  scheduledTime: Date
}

export interface NotificationJob {
  meetingId: string
  type: 'brief' | 'reminder' | 'summary'
  recipients: string[]
  content: any
}

// Queue instances
let meetingQueue: Queue<MeetingProcessingJob> | null = null
let briefingQueue: Queue<BriefingJob> | null = null
let notificationQueue: Queue<NotificationJob> | null = null

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
    })
  }
  return notificationQueue
}

// Job processors
export const processMeetingJob = async (job: Job<MeetingProcessingJob>) => {
  const { meetingId, transcript, summary, decisions, actionItems } = job.data
  
  console.log(`Processing meeting ${meetingId}`)
  
  // TODO: Implement actual meeting processing logic
  // - Generate AI summary
  // - Extract decisions
  // - Identify action items
  // - Update database
  
  return { success: true, meetingId }
}

export const processBriefingJob = async (job: Job<BriefingJob>) => {
  const { meetingId, type, scheduledTime } = job.data
  
  console.log(`Generating ${type} briefing for meeting ${meetingId}`)
  
  // TODO: Implement briefing generation logic
  // - Generate pre-brief 30 min before meeting
  // - Generate post-brief after meeting
  // - Send via email
  
  return { success: true, meetingId, type }
}

export const processNotificationJob = async (job: Job<NotificationJob>) => {
  const { meetingId, type, recipients, content } = job.data
  
  console.log(`Sending ${type} notification for meeting ${meetingId} to ${recipients.length} recipients`)
  
  // TODO: Implement notification logic
  // - Send email notifications
  // - Send Teams/Slack messages
  // - Update meeting status
  
  return { success: true, meetingId, type, recipients: recipients.length }
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

  console.log("Job workers started")
}

// Helper functions
export const scheduleBriefing = async (meetingId: string, scheduledTime: Date, type: 'pre' | 'post') => {
  const queue = getBriefingQueue()
  if (!queue) return null

  return await queue.add('briefing', {
    meetingId,
    type,
    scheduledTime,
  }, {
    delay: scheduledTime.getTime() - Date.now(),
  })
}

export const queueMeetingProcessing = async (meetingId: string, data: Partial<MeetingProcessingJob>) => {
  const queue = getMeetingQueue()
  if (!queue) return null

  return await queue.add('meeting-processing', {
    meetingId,
    ...data,
  })
}

export const queueNotification = async (meetingId: string, type: 'brief' | 'reminder' | 'summary', recipients: string[], content: any) => {
  const queue = getNotificationQueue()
  if (!queue) return null

  return await queue.add('notification', {
    meetingId,
    type,
    recipients,
    content,
  })
}
