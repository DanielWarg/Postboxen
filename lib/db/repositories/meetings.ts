import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db/client"
import type {
  MeetingMetadata,
  MeetingActionItem,
  MeetingDecisionCard,
  MeetingSummary,
  MeetingBrief,
  StakeholderProfile,
  MeetingConsent,
  ConsentProfile,
} from "@/types/meetings"

export const meetingRepository = {
  async upsertMetadata(metadata: MeetingMetadata) {
    await prisma.meeting.upsert({
      where: { id: metadata.meetingId },
      create: {
        id: metadata.meetingId,
        title: metadata.title,
        startTime: new Date(metadata.startTime),
        endTime: new Date(metadata.endTime),
        joinUrl: metadata.joinUrl,
        organizerEmail: metadata.organizerEmail,
        attendees: metadata.attendees,
        agenda: metadata.agenda,
        persona: metadata.persona,
        language: metadata.language,
        consentProfile: metadata.consentProfile,
      },
      update: {
        title: metadata.title,
        startTime: new Date(metadata.startTime),
        endTime: new Date(metadata.endTime),
        joinUrl: metadata.joinUrl,
        organizerEmail: metadata.organizerEmail,
        attendees: metadata.attendees,
        agenda: metadata.agenda,
        persona: metadata.persona,
        language: metadata.language,
        consentProfile: metadata.consentProfile,
      },
    })
  },

  async saveConsent(meetingId: string, consent: MeetingConsent) {
    await prisma.meetingConsent.upsert({
      where: { meetingId },
      create: {
        meetingId,
        profile: consent.profile,
        scope: consent.scope,
        retentionDays: consent.retentionDays,
        dataResidency: consent.dataResidency,
        acceptedAt: new Date(consent.acceptedAt),
      },
      update: {
        profile: consent.profile,
        scope: consent.scope,
        retentionDays: consent.retentionDays,
        dataResidency: consent.dataResidency,
        acceptedAt: new Date(consent.acceptedAt),
      },
    })
  },

  async saveSummary(meetingId: string, summary: MeetingSummary) {
    await prisma.meetingSummary.upsert({
      where: { meetingId },
      create: {
        meetingId,
        decisions: summary.decisions,
        actionItems: summary.actionItems,
        risks: summary.risks,
        highlights: summary.highlights,
        languages: summary.languages,
        citations: summary.citations,
      },
      update: {
        decisions: summary.decisions,
        actionItems: summary.actionItems,
        risks: summary.risks,
        highlights: summary.highlights,
        languages: summary.languages,
        citations: summary.citations,
      },
    })
  },

  async upsertDecisionCard(card: MeetingDecisionCard) {
    await prisma.decisionCard.upsert({
      where: { id: card.id },
      create: {
        id: card.id,
        meetingId: card.meetingId,
        headline: card.headline,
        problem: card.problem,
        alternatives: card.alternatives,
        recommendation: card.recommendation,
        owner: card.owner,
        decidedAt: new Date(card.decidedAt),
        consequences: card.consequences,
        citations: card.citations,
      },
      update: {
        headline: card.headline,
        problem: card.problem,
        alternatives: card.alternatives,
        recommendation: card.recommendation,
        owner: card.owner,
        decidedAt: new Date(card.decidedAt),
        consequences: card.consequences,
        citations: card.citations,
      },
    })
  },

  async upsertActionItem(item: MeetingActionItem) {
    await prisma.actionItem.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        meetingId: item.meetingId,
        title: item.title,
        description: item.description,
        owner: item.owner,
        dueDate: item.dueDate ? new Date(item.dueDate) : null,
        source: item.source,
        status: item.status,
        externalLinks: item.externalLinks,
      },
      update: {
        title: item.title,
        description: item.description,
        owner: item.owner,
        dueDate: item.dueDate ? new Date(item.dueDate) : null,
        source: item.source,
        status: item.status,
        externalLinks: item.externalLinks,
      },
    })
  },

  async updateActionStatus(id: string, status: string) {
    await prisma.actionItem.update({ where: { id }, data: { status } })
  },

  async saveBrief(meetingId: string, brief: MeetingBrief) {
    await prisma.meetingBrief.upsert({
      where: { meetingId_type: { meetingId, type: brief.type } },
      create: {
        meetingId,
        type: brief.type,
        generatedAt: new Date(brief.generatedAt),
        subject: brief.subject,
        headline: brief.headline,
        keyPoints: brief.keyPoints,
        decisions: brief.decisions,
        risks: brief.risks,
        nextSteps: brief.nextSteps,
        content: brief.content,
        delivery: brief.delivery,
      },
      update: {
        generatedAt: new Date(brief.generatedAt),
        subject: brief.subject,
        headline: brief.headline,
        keyPoints: brief.keyPoints,
        decisions: brief.decisions,
        risks: brief.risks,
        nextSteps: brief.nextSteps,
        content: brief.content,
        delivery: brief.delivery,
      },
    })
  },

  async saveStakeholders(meetingId: string, stakeholders: StakeholderProfile[]) {
    await prisma.stakeholder.deleteMany({ where: { meetingId } })
    if (!stakeholders.length) return
    await prisma.$transaction(
      stakeholders.map((stakeholder) =>
        prisma.stakeholder.create({
          data: {
            meetingId,
            email: stakeholder.email,
            name: stakeholder.name,
            interests: stakeholder.interests,
            concerns: stakeholder.concerns,
            influence: stakeholder.influence,
            preferredPitch: stakeholder.preferredPitch,
            notes: stakeholder.notes,
          },
        }),
      ),
    )
  },

  async getMeetingOverview() {
    const records = await prisma.meeting.findMany({
      include: {
        summary: true,
        decisions: true,
        actionItems: true,
        consent: true,
      },
      orderBy: { startTime: "desc" },
      take: 100,
    })

    return records.map((record) => ({
      metadata: toMetadata(record),
      summary: record.summary ? toSummary(record.summary) : undefined,
      decisions: record.decisions.map(toDecisionCard),
      actionItems: record.actionItems.map(toActionItem),
      consent: record.consent ? toConsent(record.consent) : undefined,
    }))
  },

  async getMeetingDetail(meetingId: string) {
    const record = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        summary: true,
        decisions: true,
        actionItems: true,
        briefs: true,
        stakeholders: true,
        auditEntries: true,
        consent: true,
      },
    })

    if (!record) return null

    return {
      metadata: toMetadata(record),
      summary: record.summary ? toSummary(record.summary) : undefined,
      decisions: record.decisions.map(toDecisionCard),
      actionItems: record.actionItems.map(toActionItem),
      briefs: record.briefs.map(toBrief),
      stakeholders: record.stakeholders.map(toStakeholder),
      audit: record.auditEntries.map((entry) => ({
        id: entry.id,
        meetingId: entry.meetingId ?? undefined,
        event: entry.event,
        payload: entry.payload,
        policy: entry.policy ?? undefined,
        occurredAt: entry.occurredAt.toISOString(),
      })),
      consent: record.consent ? toConsent(record.consent) : undefined,
    }
  },

  async getConsent(meetingId: string) {
    const consent = await prisma.meetingConsent.findUnique({ where: { meetingId } })
    if (!consent) return null
    return {
      profile: consent.profile as ConsentProfile,
      scope: consent.scope as MeetingConsent["scope"],
      retentionDays: consent.retentionDays,
      dataResidency: consent.dataResidency as MeetingConsent["dataResidency"],
      acceptedAt: consent.acceptedAt.toISOString(),
    }
  },

  async getActionItemById(id: string) {
    const record = await prisma.actionItem.findUnique({ where: { id } })
    return record ? toActionItem(record) : null
  },
}

const toMetadata = (record: Prisma.Meeting) => ({
  meetingId: record.id,
  title: record.title,
  startTime: record.startTime.toISOString(),
  endTime: record.endTime.toISOString(),
  joinUrl: record.joinUrl,
  organizerEmail: record.organizerEmail,
  attendees: Array.isArray(record.attendees) ? (record.attendees as string[]) : [],
  agenda: record.agenda ?? undefined,
  persona: record.persona ?? undefined,
  language: record.language ?? undefined,
  consentProfile: record.consentProfile ?? undefined,
})

const toSummary = (summary: Prisma.MeetingSummary) => ({
  meetingId: summary.meetingId,
  decisions: toStringArray(summary.decisions),
  actionItems: summary.actionItems as MeetingSummary["actionItems"],
  risks: toStringArray(summary.risks),
  highlights: toStringArray(summary.highlights),
  languages: toStringArray(summary.languages),
  citations: summary.citations as MeetingSummary["citations"],
})

const toDecisionCard = (card: Prisma.DecisionCard): MeetingDecisionCard => ({
  id: card.id,
  meetingId: card.meetingId,
  headline: card.headline,
  problem: card.problem,
  alternatives: card.alternatives as MeetingDecisionCard["alternatives"],
  recommendation: card.recommendation,
  owner: card.owner,
  decidedAt: card.decidedAt.toISOString(),
  consequences: toStringArray(card.consequences),
  citations: card.citations as MeetingDecisionCard["citations"],
})

const toActionItem = (item: Prisma.ActionItem): MeetingActionItem => ({
  id: item.id,
  meetingId: item.meetingId,
  title: item.title,
  description: item.description,
  owner: item.owner,
  dueDate: item.dueDate ? item.dueDate.toISOString() : undefined,
  source: item.source as MeetingActionItem["source"],
  status: item.status as MeetingActionItem["status"],
  externalLinks: Array.isArray(item.externalLinks)
    ? (item.externalLinks as MeetingActionItem["externalLinks"])
    : [],
})

const toBrief = (brief: Prisma.MeetingBrief): MeetingBrief => ({
  type: brief.type as MeetingBrief["type"],
  generatedAt: brief.generatedAt.toISOString(),
  subject: brief.subject,
  headline: brief.headline,
  keyPoints: toStringArray(brief.keyPoints),
  decisions: brief.decisions ? toStringArray(brief.decisions) : undefined,
  risks: brief.risks ? toStringArray(brief.risks) : undefined,
  nextSteps: brief.nextSteps ? toStringArray(brief.nextSteps) : undefined,
  content: brief.content,
  delivery: brief.delivery as MeetingBrief["delivery"],
})

const toStakeholder = (stakeholder: Prisma.Stakeholder): StakeholderProfile => ({
  email: stakeholder.email,
  name: stakeholder.name ?? undefined,
  interests: toStringArray(stakeholder.interests),
  concerns: toStringArray(stakeholder.concerns),
  influence: stakeholder.influence as StakeholderProfile["influence"],
  preferredPitch: stakeholder.preferredPitch ?? undefined,
  notes: stakeholder.notes ?? undefined,
})

const toConsent = (consent: Prisma.MeetingConsent): MeetingConsent => ({
  profile: consent.profile as ConsentProfile,
  scope: consent.scope as MeetingConsent["scope"],
  retentionDays: consent.retentionDays,
  dataResidency: consent.dataResidency as MeetingConsent["dataResidency"],
  acceptedAt: consent.acceptedAt.toISOString(),
})

const toStringArray = (value: Prisma.JsonValue | null | undefined): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry))
  }
  return []
}
