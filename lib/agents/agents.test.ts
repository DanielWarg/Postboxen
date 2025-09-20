import { DecisionCardProcessor } from '@/lib/agents/decision-cards'
import { BriefingEngine } from '@/lib/agents/briefing'
import { RetentionManager } from '@/lib/agents/retention'
import { RegwatchManager } from '@/lib/agents/regwatch'

describe('Agent Modules', () => {
  describe('DecisionCardProcessor', () => {
    it('should process speech segments and identify decisions', () => {
      const processor = new DecisionCardProcessor()
      
      const speechSegments = [
        {
          id: 'seg-1',
          speaker: 'Alice',
          text: 'Vi behöver bestämma om vi ska köpa den nya servern eller inte.',
          timestamp: Date.now(),
          confidence: 0.95,
          language: 'sv',
          redacted: false,
        },
        {
          id: 'seg-2',
          speaker: 'Bob',
          text: 'Jag tycker vi ska köpa den. Den kostar 50 000 kr men ger oss bättre prestanda.',
          timestamp: Date.now() + 1000,
          confidence: 0.92,
          language: 'sv',
          redacted: false,
        },
        {
          id: 'seg-3',
          speaker: 'Alice',
          text: 'Okej, då bestämmer vi oss för att köpa servern.',
          timestamp: Date.now() + 2000,
          confidence: 0.98,
          language: 'sv',
          redacted: false,
        },
      ]

      const decisions = processor.processSegments(speechSegments)

      expect(decisions).toHaveLength(1)
      expect(decisions[0].headline).toContain('server')
      expect(decisions[0].alternatives).toHaveLength(2)
      expect(decisions[0].recommendation).toBeDefined()
    })

    it('should handle empty segments', () => {
      const processor = new DecisionCardProcessor()
      const decisions = processor.processSegments([])
      
      expect(decisions).toHaveLength(0)
    })
  })

  describe('BriefingEngine', () => {
    it('should generate pre-brief', async () => {
      const engine = new BriefingEngine()
      
      const meetingData = {
        id: 'meeting-123',
        title: 'Projektmöte',
        startTime: new Date().toISOString(),
        participants: ['alice@example.com', 'bob@example.com'],
        agenda: ['Diskutera projektstatus', 'Planera nästa sprint'],
      }

      const brief = await engine.generatePreBrief(meetingData)

      expect(brief).toBeDefined()
      expect(brief.type).toBe('pre')
      expect(brief.meetingId).toBe('meeting-123')
      expect(brief.content).toContain('Projektmöte')
    })

    it('should generate post-brief', async () => {
      const engine = new BriefingEngine()
      
      const meetingData = {
        id: 'meeting-123',
        title: 'Projektmöte',
        endTime: new Date().toISOString(),
        decisions: [
          {
            id: 'dec-1',
            headline: 'Köpa ny server',
            recommendation: 'Ja, köp servern',
          },
        ],
        actionItems: [
          {
            id: 'action-1',
            title: 'Beställa server',
            assignee: 'bob@example.com',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      }

      const brief = await engine.generatePostBrief(meetingData)

      expect(brief).toBeDefined()
      expect(brief.type).toBe('post')
      expect(brief.meetingId).toBe('meeting-123')
      expect(brief.content).toContain('server')
    })
  })

  describe('RetentionManager', () => {
    it('should calculate retention based on profile', () => {
      const manager = new RetentionManager()
      
      const retentionDays = manager.calculateRetentionDays('juridik')
      expect(retentionDays).toBe(365)

      const basRetention = manager.calculateRetentionDays('bas')
      expect(basRetention).toBe(30)

      const plusRetention = manager.calculateRetentionDays('plus')
      expect(plusRetention).toBe(90)
    })

    it('should handle invalid profile', () => {
      const manager = new RetentionManager()
      
      const retentionDays = manager.calculateRetentionDays('invalid' as any)
      expect(retentionDays).toBe(30) // Default to bas
    })
  })

  describe('RegwatchManager', () => {
    it('should check regulatory sources', async () => {
      const manager = new RegwatchManager()
      
      const sources = [
        {
          id: 'eu-ai-act',
          title: 'EU AI Act',
          url: 'https://example.com/ai-act',
          jurisdiction: 'EU',
        },
      ]

      const results = await manager.checkSources(sources)

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })

    it('should handle empty sources', async () => {
      const manager = new RegwatchManager()
      
      const results = await manager.checkSources([])
      expect(results).toHaveLength(0)
    })
  })
})
