import { PrismaClient } from '@prisma/client'
import prisma from '@/lib/db'

// Optimized database queries to avoid N+1 problems and improve performance
export const optimizedMeetingQueries = {
  // Get meeting with all relations in a single query
  getMeetingWithRelations: async (meetingId: string) => {
    return prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        consent: true,
        decisionCards: {
          orderBy: { createdAt: 'desc' },
        },
        actionItems: {
          orderBy: { createdAt: 'desc' },
        },
        briefs: {
          orderBy: { createdAt: 'desc' },
        },
        stakeholders: true,
        transcriptSegments: {
          orderBy: { timestamp: 'asc' },
          take: 100, // Limit transcript segments for performance
        },
      },
    })
  },

  // Paginated meetings query for better performance
  getMeetingsPaginated: async (page: number = 1, limit: number = 20, organizerEmail?: string) => {
    const skip = (page - 1) * limit
    const where = organizerEmail ? { organizerEmail } : {}
    
    return prisma.meeting.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        organizerEmail: true,
        startTime: true,
        endTime: true,
        status: true,
        platform: true,
        createdAt: true,
        updatedAt: true,
        // Exclude heavy fields like transcript for list views
      },
    })
  },

  // Get dashboard statistics efficiently
  getDashboardStats: async (organizerEmail?: string) => {
    const where = organizerEmail ? { organizerEmail } : {}
    
    const [totalMeetings, activeMeetings, completedMeetings, recentMeetings] = await Promise.all([
      prisma.meeting.count({ where }),
      prisma.meeting.count({ where: { ...where, status: 'active' } }),
      prisma.meeting.count({ where: { ...where, status: 'completed' } }),
      prisma.meeting.count({ 
        where: { 
          ...where, 
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        } 
      }),
    ])

    return {
      totalMeetings,
      activeMeetings,
      completedMeetings,
      recentMeetings,
    }
  },

  // Get meetings with decision cards count
  getMeetingsWithDecisionCount: async (page: number = 1, limit: number = 20) => {
    const skip = (page - 1) * limit
    
    return prisma.meeting.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        organizerEmail: true,
        startTime: true,
        endTime: true,
        status: true,
        platform: true,
        createdAt: true,
        _count: {
          select: {
            decisionCards: true,
            actionItems: true,
            briefs: true,
          },
        },
      },
    })
  },

  // Get user consent efficiently
  getUserConsent: async (userEmail: string) => {
    return prisma.meetingConsent.findFirst({
      where: {
        meeting: {
          organizerEmail: userEmail,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            organizerEmail: true,
          },
        },
      },
    })
  },

  // Get queue statistics efficiently
  getQueueStats: async () => {
    const [totalJobs, completedJobs, failedJobs, activeJobs] = await Promise.all([
      prisma.meeting.count(),
      prisma.meeting.count({ where: { status: 'completed' } }),
      prisma.meeting.count({ where: { status: 'failed' } }),
      prisma.meeting.count({ where: { status: 'active' } }),
    ])

    return {
      totalJobs,
      completedJobs,
      failedJobs,
      activeJobs,
      successRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
    }
  },
}

// Batch operations for better performance
export const batchOperations = {
  // Batch create decision cards
  createDecisionCards: async (meetingId: string, decisionCards: any[]) => {
    return prisma.decisionCard.createMany({
      data: decisionCards.map(card => ({
        ...card,
        meetingId,
      })),
    })
  },

  // Batch create action items
  createActionItems: async (meetingId: string, actionItems: any[]) => {
    return prisma.actionItem.createMany({
      data: actionItems.map(item => ({
        ...item,
        meetingId,
      })),
    })
  },

  // Batch create transcript segments
  createTranscriptSegments: async (meetingId: string, segments: any[]) => {
    return prisma.transcriptSegment.createMany({
      data: segments.map(segment => ({
        ...segment,
        meetingId,
      })),
    })
  },

  // Batch update meetings
  updateMeetingsStatus: async (meetingIds: string[], status: string) => {
    return prisma.meeting.updateMany({
      where: {
        id: { in: meetingIds },
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    })
  },
}

// Transaction helpers for complex operations
export const transactionHelpers = {
  // Complete meeting processing in a single transaction
  completeMeetingProcessing: async (meetingId: string, data: {
    summary?: any
    decisionCards?: any[]
    actionItems?: any[]
    transcriptSegments?: any[]
  }) => {
    return prisma.$transaction(async (tx) => {
      // Update meeting
      const updatedMeeting = await tx.meeting.update({
        where: { id: meetingId },
        data: {
          summary: data.summary,
          status: 'completed',
          updatedAt: new Date(),
        },
      })

      // Batch create related data
      if (data.decisionCards?.length) {
        await tx.decisionCard.createMany({
          data: data.decisionCards.map(card => ({
            ...card,
            meetingId,
          })),
        })
      }

      if (data.actionItems?.length) {
        await tx.actionItem.createMany({
          data: data.actionItems.map(item => ({
            ...item,
            meetingId,
          })),
        })
      }

      if (data.transcriptSegments?.length) {
        await tx.transcriptSegment.createMany({
          data: data.transcriptSegments.map(segment => ({
            ...segment,
            meetingId,
          })),
        })
      }

      return updatedMeeting
    })
  },

  // Delete meeting and all related data
  deleteMeetingCascade: async (meetingId: string) => {
    return prisma.$transaction(async (tx) => {
      // Delete related data first (due to foreign key constraints)
      await tx.transcriptSegment.deleteMany({ where: { meetingId } })
      await tx.decisionCard.deleteMany({ where: { meetingId } })
      await tx.actionItem.deleteMany({ where: { meetingId } })
      await tx.meetingBrief.deleteMany({ where: { meetingId } })
      await tx.stakeholder.deleteMany({ where: { meetingId } })
      await tx.meetingConsent.deleteMany({ where: { meetingId } })

      // Delete meeting
      return tx.meeting.delete({ where: { id: meetingId } })
    })
  },
}

// Performance monitoring helpers
export const performanceHelpers = {
  // Track query performance
  trackQuery: async <T>(queryName: string, queryFn: () => Promise<T>): Promise<T> => {
    const start = Date.now()
    try {
      const result = await queryFn()
      const duration = Date.now() - start
      console.log(`DB_PERF: ${queryName} - ${duration}ms`)
      return result
    } catch (error) {
      const duration = Date.now() - start
      console.error(`DB_ERROR: ${queryName} - ${duration}ms - ${error}`)
      throw error
    }
  },

  // Get database health status
  getDatabaseHealth: async () => {
    try {
      const start = Date.now()
      await prisma.$queryRaw`SELECT 1`
      const duration = Date.now() - start
      
      return {
        status: 'healthy',
        responseTime: duration,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }
    }
  },
}
