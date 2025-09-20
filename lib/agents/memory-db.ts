import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/db"

import type {
  MeetingActionItem,
  MeetingConsent,
  MeetingDecisionCard,
  MeetingTranscriptSegment,
  MeetingSummary,
  MeetingMetadata,
  MeetingBrief,
  StakeholderProfile,
} from "@/types/meetings"
import type { MeetingEvent } from "@/lib/agents/events"
import { env } from "@/lib/config"

class DatabaseStore {
  async appendTranscript(meetingId: string, segment: MeetingTranscriptSegment) {
    // Store transcript segments in the dedicated transcriptSegments table
    await prisma.transcriptSegment.create({
      data: {
        id: segment.id,
        meetingId: meetingId,
        speaker: segment.speaker,
        text: segment.text,
        timestamp: segment.timestamp,
        confidence: segment.confidence,
        language: segment.language,
        redacted: segment.redacted,
      }
    })
  }

  async appendDecision(meetingId: string, card: MeetingDecisionCard) {
    await prisma.decisionCard.upsert({
      where: { id: card.id },
      update: {
        headline: card.headline,
        problem: card.problem,
        alternatives: card.alternatives,
        recommendation: card.recommendation,
        owner: card.owner,
        decidedAt: card.decidedAt,
        consequences: card.consequences,
        citations: card.citations,
      },
      create: {
        id: card.id,
        meetingId,
        headline: card.headline,
        problem: card.problem,
        alternatives: card.alternatives,
        recommendation: card.recommendation,
        owner: card.owner,
        decidedAt: card.decidedAt,
        consequences: card.consequences,
        citations: card.citations,
      }
    })
  }

  async appendAction(meetingId: string, action: MeetingActionItem) {
    await prisma.actionItem.upsert({
      where: { id: action.id },
      update: {
        title: action.title,
        description: action.description,
        owner: action.owner,
        dueDate: action.dueDate,
        source: action.source,
        status: action.status,
        externalLinks: action.externalLinks,
      },
      create: {
        id: action.id,
        meetingId,
        title: action.title,
        description: action.description,
        owner: action.owner,
        dueDate: action.dueDate,
        source: action.source,
        status: action.status,
        externalLinks: action.externalLinks,
      }
    })
  }

  async setConsent(meetingId: string, consent: MeetingConsent) {
    await prisma.meetingConsent.upsert({
      where: { meetingId },
      update: {
        profile: consent.profile,
        scope: consent.scope,
        retentionDays: consent.retentionDays,
        dataResidency: consent.dataResidency,
        acceptedAt: consent.acceptedAt,
      },
      create: {
        meetingId,
        profile: consent.profile,
        scope: consent.scope,
        retentionDays: consent.retentionDays,
        dataResidency: consent.dataResidency,
        acceptedAt: consent.acceptedAt,
      }
    })
  }

  async setSummary(meetingId: string, summary: MeetingSummary) {
    await prisma.meetingSummary.upsert({
      where: { meetingId },
      update: {
        decisions: summary.decisions,
        actionItems: summary.actionItems,
        risks: summary.risks,
        highlights: summary.highlights,
        languages: summary.languages,
        citations: summary.citations,
      },
      create: {
        meetingId,
        decisions: summary.decisions,
        actionItems: summary.actionItems,
        risks: summary.risks,
        highlights: summary.highlights,
        languages: summary.languages,
        citations: summary.citations,
      }
    })
  }

  async setMetadata(meetingId: string, metadata: MeetingMetadata) {
    await prisma.meeting.upsert({
      where: { id: meetingId },
      update: {
        title: metadata.title,
        startTime: metadata.startTime,
        endTime: metadata.endTime,
        joinUrl: metadata.joinUrl,
        organizerEmail: metadata.organizerEmail,
        attendees: metadata.attendees,
        agenda: metadata.agenda,
        persona: metadata.persona,
        language: metadata.language,
        consentProfile: metadata.consentProfile,
      },
      create: {
        id: meetingId,
        title: metadata.title,
        startTime: metadata.startTime,
        endTime: metadata.endTime,
        joinUrl: metadata.joinUrl,
        organizerEmail: metadata.organizerEmail,
        attendees: metadata.attendees,
        agenda: metadata.agenda,
        persona: metadata.persona,
        language: metadata.language,
        consentProfile: metadata.consentProfile,
      }
    })
  }

  async setBrief(meetingId: string, brief: MeetingBrief) {
    await prisma.meetingBrief.upsert({
      where: {
        meetingId_type: {
          meetingId,
          type: brief.type
        }
      },
      update: {
        generatedAt: brief.generatedAt,
        subject: brief.subject,
        headline: brief.headline,
        keyPoints: brief.keyPoints,
        decisions: brief.decisions,
        risks: brief.risks,
        nextSteps: brief.nextSteps,
        content: brief.content,
        delivery: brief.delivery,
      },
      create: {
        meetingId,
        type: brief.type,
        generatedAt: brief.generatedAt,
        subject: brief.subject,
        headline: brief.headline,
        keyPoints: brief.keyPoints,
        decisions: brief.decisions,
        risks: brief.risks,
        nextSteps: brief.nextSteps,
        content: brief.content,
        delivery: brief.delivery,
      }
    })
  }

  async setStakeholders(meetingId: string, stakeholders: StakeholderProfile[]) {
    // Delete existing stakeholders for this meeting
    await prisma.stakeholder.deleteMany({
      where: { meetingId }
    })

    // Create new stakeholders
    await prisma.stakeholder.createMany({
      data: stakeholders.map(stakeholder => ({
        meetingId,
        email: stakeholder.email,
        name: stakeholder.name,
        interests: stakeholder.interests,
        concerns: stakeholder.concerns,
        influence: stakeholder.influence,
        preferredPitch: stakeholder.preferredPitch,
        notes: stakeholder.notes,
      }))
    })
  }

  async appendEvent(meetingId: string, event: MeetingEvent) {
    await prisma.auditEntry.create({
      data: {
        meetingId,
        event: event.type,
        payload: event.payload,
        policy: event.policy,
        occurredAt: event.occurredAt,
      }
    })
  }

  async getMeeting(meetingId: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        summary: true,
        decisions: true,
        actionItems: true,
        briefs: true,
        stakeholders: true,
        consent: true,
        auditEntries: true,
      }
    })

    if (!meeting) return null

    // Convert Prisma data back to our types
    return {
      createdAt: meeting.createdAt.getTime(),
      expiresAt: meeting.createdAt.getTime() + env.MEMORY_DEFAULT_TTL_MS,
      consent: meeting.consent,
      transcript: meeting.transcriptSegments?.map(t => ({
        id: t.id,
        speaker: t.speaker,
        text: t.text,
        timestamp: t.timestamp,
        confidence: t.confidence,
        language: t.language,
        redacted: t.redacted,
      })) || []
      decisionCards: meeting.decisions.map(d => ({
        id: d.id,
        headline: d.headline,
        problem: d.problem,
        alternatives: d.alternatives as any,
        recommendation: d.recommendation,
        owner: d.owner,
        decidedAt: d.decidedAt,
        consequences: d.consequences as any,
        citations: d.citations as any,
      })),
      actionItems: meeting.actionItems.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        owner: a.owner,
        dueDate: a.dueDate,
        source: a.source,
        status: a.status,
        externalLinks: a.externalLinks as any,
      })),
      summary: meeting.summary ? {
        decisions: meeting.summary.decisions as any,
        actionItems: meeting.summary.actionItems as any,
        risks: meeting.summary.risks as any,
        highlights: meeting.summary.highlights as any,
        languages: meeting.summary.languages as any,
        citations: meeting.summary.citations as any,
      } : undefined,
      events: meeting.auditEntries.map(e => ({
        type: e.event,
        payload: e.payload as any,
        policy: e.policy,
        occurredAt: e.occurredAt,
      })),
      metadata: {
        meetingId: meeting.id,
        title: meeting.title,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        joinUrl: meeting.joinUrl,
        organizerEmail: meeting.organizerEmail,
        attendees: meeting.attendees as any,
        agenda: meeting.agenda,
        persona: meeting.persona,
        language: meeting.language,
        consentProfile: meeting.consentProfile,
      },
      briefs: {
        pre: meeting.briefs.find(b => b.type === 'pre') ? {
          type: 'pre' as const,
          generatedAt: meeting.briefs.find(b => b.type === 'pre')!.generatedAt,
          subject: meeting.briefs.find(b => b.type === 'pre')!.subject,
          headline: meeting.briefs.find(b => b.type === 'pre')!.headline,
          keyPoints: meeting.briefs.find(b => b.type === 'pre')!.keyPoints as any,
          decisions: meeting.briefs.find(b => b.type === 'pre')!.decisions as any,
          risks: meeting.briefs.find(b => b.type === 'pre')!.risks as any,
          nextSteps: meeting.briefs.find(b => b.type === 'pre')!.nextSteps as any,
          content: meeting.briefs.find(b => b.type === 'pre')!.content,
          delivery: meeting.briefs.find(b => b.type === 'pre')!.delivery as any,
        } : undefined,
        post: meeting.briefs.find(b => b.type === 'post') ? {
          type: 'post' as const,
          generatedAt: meeting.briefs.find(b => b.type === 'post')!.generatedAt,
          subject: meeting.briefs.find(b => b.type === 'post')!.subject,
          headline: meeting.briefs.find(b => b.type === 'post')!.headline,
          keyPoints: meeting.briefs.find(b => b.type === 'post')!.keyPoints as any,
          decisions: meeting.briefs.find(b => b.type === 'post')!.decisions as any,
          risks: meeting.briefs.find(b => b.type === 'post')!.risks as any,
          nextSteps: meeting.briefs.find(b => b.type === 'post')!.nextSteps as any,
          content: meeting.briefs.find(b => b.type === 'post')!.content,
          delivery: meeting.briefs.find(b => b.type === 'post')!.delivery as any,
        } : undefined,
      },
      stakeholders: meeting.stakeholders.map(s => ({
        email: s.email,
        name: s.name,
        interests: s.interests as any,
        concerns: s.concerns as any,
        influence: s.influence,
        preferredPitch: s.preferredPitch,
        notes: s.notes,
      })),
    }
  }

  async listMeetings() {
    const meetings = await prisma.meeting.findMany({
      select: {
        id: true,
        createdAt: true,
        title: true,
        startTime: true,
        decisions: { select: { id: true } },
        actionItems: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' }
    })

    return meetings.map(meeting => ({
      meetingId: meeting.id,
      createdAt: meeting.createdAt.getTime(),
      expiresAt: meeting.createdAt.getTime() + env.MEMORY_DEFAULT_TTL_MS,
      decisionCount: meeting.decisions.length,
      actionCount: meeting.actionItems.length,
      startTime: meeting.startTime,
      title: meeting.title,
    }))
  }

  async purgeExpired() {
    const cutoffDate = new Date(Date.now() - env.MEMORY_DEFAULT_TTL_MS)
    await prisma.meeting.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    })
  }
}

let store: DatabaseStore | undefined

export const getMemoryStore = () => {
  if (!store) {
    store = new DatabaseStore()
    // Run cleanup every hour instead of every minute for database
    setInterval(() => store?.purgeExpired(), 60 * 60 * 1000).unref()
  }
  return store
}

export const createEphemeralId = () => randomUUID()

export const getMeetingById = (meetingId: string) => getMemoryStore().getMeeting(meetingId)
export const setMeetingMetadata = (metadata: MeetingMetadata) => getMemoryStore().setMetadata(metadata.meetingId, metadata)
export const setStakeholderProfiles = (meetingId: string, stakeholders: StakeholderProfile[]) =>
  getMemoryStore().setStakeholders(meetingId, stakeholders)
