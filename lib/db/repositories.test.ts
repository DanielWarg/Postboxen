import { meetingRepository } from '@/lib/db/repositories/meetings'
import { regwatchRepository } from '@/lib/db/repositories/regwatch'

// Mock Prisma client
jest.mock('@/lib/db', () => ({
  prisma: {
    meeting: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    decisionCard: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    meetingBrief: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    regwatchSource: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    regwatchChange: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('Database Repositories', () => {
  describe('meetingRepository', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should get meeting overview', async () => {
      const mockMeetings = [
        {
          id: 'meeting-1',
          title: 'Test Meeting',
          startTime: new Date(),
          endTime: new Date(),
          organizerEmail: 'organizer@example.com',
          decisions: [],
          actionItems: [],
        },
      ]

      const { prisma } = require('@/lib/db')
      prisma.meeting.findMany.mockResolvedValue(mockMeetings)

      const result = await meetingRepository.getMeetingOverview()

      expect(result).toEqual(mockMeetings)
      expect(prisma.meeting.findMany).toHaveBeenCalled()
    })

    it('should get recent decision cards', async () => {
      const mockDecisions = [
        {
          id: 'dec-1',
          headline: 'Test Decision',
          decidedAt: new Date(),
          meeting: {
            title: 'Test Meeting',
          },
        },
      ]

      const { prisma } = require('@/lib/db')
      prisma.decisionCard.findMany.mockResolvedValue(mockDecisions)

      const result = await meetingRepository.getRecentDecisionCards(5)

      expect(result).toEqual(mockDecisions)
      expect(prisma.decisionCard.findMany).toHaveBeenCalledWith({
        take: 5,
        orderBy: { decidedAt: 'desc' },
        include: { meeting: true },
      })
    })

    it('should get recent briefs', async () => {
      const mockBriefs = [
        {
          id: 'brief-1',
          type: 'pre',
          generatedAt: new Date(),
          meeting: {
            title: 'Test Meeting',
          },
        },
      ]

      const { prisma } = require('@/lib/db')
      prisma.meetingBrief.findMany.mockResolvedValue(mockBriefs)

      const result = await meetingRepository.getRecentBriefs(3)

      expect(result).toEqual(mockBriefs)
      expect(prisma.meetingBrief.findMany).toHaveBeenCalledWith({
        take: 3,
        orderBy: { generatedAt: 'desc' },
        include: { meeting: true },
      })
    })
  })

  describe('regwatchRepository', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should list regulatory sources', async () => {
      const mockSources = [
        {
          id: 'source-1',
          title: 'EU AI Act',
          jurisdiction: 'EU',
          url: 'https://example.com',
          lastChecked: new Date(),
        },
      ]

      const { prisma } = require('@/lib/db')
      prisma.regwatchSource.findMany.mockResolvedValue(mockSources)

      const result = await regwatchRepository.list({})

      expect(result).toEqual(mockSources)
      expect(prisma.regwatchSource.findMany).toHaveBeenCalled()
    })

    it('should get highlights', async () => {
      const mockHighlights = [
        {
          id: 'highlight-1',
          sourceTitle: 'EU AI Act',
          section: 'Article 5',
          summary: 'High-risk AI systems',
          severity: 'critical',
          impact: 'Affects all AI systems',
        },
      ]

      const { prisma } = require('@/lib/db')
      prisma.regwatchChange.findMany.mockResolvedValue(mockHighlights)

      const result = await regwatchRepository.getHighlights(3)

      expect(result).toEqual(mockHighlights)
      expect(prisma.regwatchChange.findMany).toHaveBeenCalledWith({
        take: 3,
        orderBy: { detectedAt: 'desc' },
        include: { source: true },
      })
    })
  })
})
