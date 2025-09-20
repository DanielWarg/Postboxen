import type { Prisma } from "@prisma/client"

import prisma from "@/lib/db"
import type {
  MeetingActionItem,
  MeetingBrief,
  MeetingConsent,
  MeetingDecisionCard,
  MeetingMetadata,
  MeetingSummary,
  StakeholderProfile,
} from "@/types/meetings"

type MeetingOverviewRecord = Awaited<ReturnType<typeof prisma.meeting.findMany>>[number]

const toDateOrNull = (value: string | Date | null | undefined) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const toISOStringOrNull = (value: Date | null | undefined) =>
  value ? value.toISOString() : undefined

const toStringArray = (value: Prisma.JsonValue | null | undefined): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : String(item)))
      .filter(Boolean)
  }
  return []
}

const toActionSummary = (
  value: Prisma.JsonValue | null | undefined,
): MeetingSummary["actionItems"] => {
  if (!Array.isArray(value)) return []
  return value.reduce<MeetingSummary["actionItems"]>((items, raw) => {
    if (!raw || typeof raw !== "object") return items
    const owner = "owner" in raw && typeof raw.owner === "string" ? raw.owner : ""
    const description =
      "description" in raw && typeof raw.description === "string"
        ? raw.description
        : ""
    if (!owner || !description) return items
    const due = "due" in raw && typeof raw.due === "string" ? raw.due : undefined
    items.push({ owner, description, due })
    return items
  }, [])
}

const toExternalLinks = (
  value: Prisma.JsonValue | null | undefined,
): MeetingActionItem["externalLinks"] => {
  if (!Array.isArray(value)) return []
  return value.reduce<MeetingActionItem["externalLinks"]>((links, raw) => {
    if (!raw || typeof raw !== "object") return links
    const provider =
      "provider" in raw && typeof raw.provider === "string" ? raw.provider : undefined
    const url = "url" in raw && typeof raw.url === "string" ? raw.url : undefined
    if (!provider || !url) return links
    links.push({ provider: provider as MeetingActionItem["externalLinks"][number]["provider"], url })
    return links
  }, [])
}

const toDecisionAlternatives = (
  value: Prisma.JsonValue | null | undefined,
): MeetingDecisionCard["alternatives"] => {
  if (!Array.isArray(value)) {
    return [
      { label: "A", description: "Genomföra som föreslaget" },
      { label: "B", description: "Skjuta upp för mer analys" },
    ]
  }
  return value.reduce<MeetingDecisionCard["alternatives"]>((alternatives, raw, index) => {
    if (!raw || typeof raw !== "object") return alternatives
    const label =
      "label" in raw && typeof raw.label === "string"
        ? raw.label
        : index === 0
          ? "A"
          : index === 1
            ? "B"
            : `Alt ${index + 1}`
    const description =
      "description" in raw && typeof raw.description === "string"
        ? raw.description
        : "Alternativ beskrivning saknas"
    alternatives.push({ label, description })
    return alternatives
  }, [])
}

const toCitations = (value: Prisma.JsonValue | null | undefined): MeetingDecisionCard["citations"] => {
  if (!Array.isArray(value)) return []
  return value.reduce<MeetingDecisionCard["citations"]>((citations, raw) => {
    if (!raw || typeof raw !== "object") return citations
    const label = "label" in raw && typeof raw.label === "string" ? raw.label : undefined
    const description =
      "description" in raw && typeof raw.description === "string"
        ? raw.description
        : undefined
    if (!label || !description) return citations
    citations.push({
      label,
      description,
      url: "url" in raw && typeof raw.url === "string" ? raw.url : undefined,
      law: "law" in raw && typeof raw.law === "string" ? raw.law : undefined,
      article: "article" in raw && typeof raw.article === "string" ? raw.article : undefined,
      version: "version" in raw && typeof raw.version === "string" ? raw.version : undefined,
      publishedAt:
        "publishedAt" in raw && typeof raw.publishedAt === "string"
          ? raw.publishedAt
          : undefined,
    })
    return citations
  }, [])
}

const toDelivery = (
  value: Prisma.JsonValue | null | undefined,
): MeetingBrief["delivery"] => {
  if (!Array.isArray(value)) return []
  return value.reduce<MeetingBrief["delivery"]>((items, raw) => {
    if (!raw || typeof raw !== "object") return items
    const channel =
      "channel" in raw && (raw.channel === "email" || raw.channel === "api")
        ? raw.channel
        : undefined
    const target = "target" in raw && typeof raw.target === "string" ? raw.target : undefined
    if (!channel || !target) return items
    items.push({ channel, target })
    return items
  }, [])
}

const toStakeholderProfiles = (
  records: Array<Prisma.StakeholderGetPayload<{ include: {} }>>,
): StakeholderProfile[] =>
  records.map((record) => ({
    email: record.email,
    name: record.name ?? undefined,
    interests: toStringArray(record.interests),
    concerns: toStringArray(record.concerns),
    influence:
      record.influence === "high" || record.influence === "low" || record.influence === "medium"
        ? record.influence
        : "medium",
    preferredPitch: record.preferredPitch ?? undefined,
    notes: record.notes ?? undefined,
  }))

const mapMetadataFromRecord = (record: MeetingOverviewRecord): MeetingMetadata => ({
  meetingId: record.id,
  title: record.title,
  startTime: record.startTime.toISOString(),
  endTime: record.endTime.toISOString(),
  joinUrl: record.joinUrl,
  organizerEmail: record.organizerEmail,
  attendees: toStringArray(record.attendees),
  agenda: record.agenda ?? undefined,
  persona: record.persona ?? undefined,
  language: record.language ?? undefined,
  consentProfile: record.consentProfile ?? undefined,
})

const mapSummaryFromRecord = (
  record: Prisma.MeetingSummaryGetPayload<{ include: {} }>,
): MeetingSummary => ({
  meetingId: record.meetingId,
  decisions: toStringArray(record.decisions),
  actionItems: toActionSummary(record.actionItems),
  risks: toStringArray(record.risks),
  highlights: toStringArray(record.highlights),
  languages: toStringArray(record.languages),
  citations: toCitations(record.citations),
})

const mapDecisionFromRecord = (
  record: Prisma.DecisionCardGetPayload<{
    include: { meeting: { select: { id: true; title: true; startTime: true; persona: true; language: true } } }
  }>,
): MeetingDecisionCard & {
  meetingTitle: string
  meeting: {
    id: string
    title: string
    startTime?: string
    persona?: string
    language?: string
  }
} => ({
  id: record.id,
  meetingId: record.meetingId,
  headline: record.headline,
  problem: record.problem,
  alternatives: toDecisionAlternatives(record.alternatives),
  recommendation: record.recommendation,
  owner: record.owner,
  decidedAt: toISOStringOrNull(record.decidedAt) ?? new Date().toISOString(),
  consequences: toStringArray(record.consequences),
  citations: toCitations(record.citations),
  meetingTitle: record.meeting.title,
  meeting: {
    id: record.meeting.id,
    title: record.meeting.title,
    startTime: record.meeting.startTime?.toISOString(),
    persona: record.meeting.persona ?? undefined,
    language: record.meeting.language ?? undefined,
  },
})

const mapActionItemFromRecord = (
  record: Prisma.ActionItemGetPayload<{ include: { meeting: { select: { title: true } } } }>,
): MeetingActionItem & { meetingTitle: string } => ({
  id: record.id,
  meetingId: record.meetingId,
  title: record.title,
  description: record.description,
  owner: record.owner,
  dueDate: toISOStringOrNull(record.dueDate ?? undefined),
  source: record.source as MeetingActionItem["source"],
  status: record.status as MeetingActionItem["status"],
  externalLinks: toExternalLinks(record.externalLinks),
  meetingTitle: record.meeting.title,
})

const mapBriefFromRecord = (
  record: Prisma.MeetingBriefGetPayload<{ include: { meeting: { select: { title: true } } } }>,
): MeetingBrief & { meetingId: string; meetingTitle: string } => ({
  type: record.type as MeetingBrief["type"],
  generatedAt: record.generatedAt.toISOString(),
  subject: record.subject,
  headline: record.headline,
  keyPoints: toStringArray(record.keyPoints),
  decisions: toStringArray(record.decisions),
  risks: toStringArray(record.risks),
  nextSteps: toStringArray(record.nextSteps),
  content: record.content,
  delivery: toDelivery(record.delivery),
  meetingId: record.meetingId,
  meetingTitle: record.meeting.title,
})

const mapConsentFromRecord = (
  record: Prisma.MeetingConsentGetPayload<{ include: {} }>,
): MeetingConsent => ({
  profile: record.profile as MeetingConsent["profile"],
  acceptedAt: record.acceptedAt.toISOString(),
  scope: toStringArray(record.scope) as MeetingConsent["scope"],
  retentionDays: record.retentionDays,
  dataResidency: record.dataResidency as MeetingConsent["dataResidency"],
})

const createMeetingData = (metadata: MeetingMetadata): Prisma.MeetingCreateInput => ({
  id: metadata.meetingId,
  title: metadata.title,
  startTime: toDateOrNull(metadata.startTime) ?? new Date(),
  endTime: toDateOrNull(metadata.endTime) ?? new Date(),
  joinUrl: metadata.joinUrl,
  organizerEmail: metadata.organizerEmail,
  attendees: metadata.attendees,
  agenda: metadata.agenda ?? null,
  persona: metadata.persona ?? null,
  language: metadata.language ?? null,
  consentProfile: metadata.consentProfile ?? null,
})

const updateMeetingData = (
  metadata: Partial<MeetingMetadata>,
): Prisma.MeetingUpdateInput => ({
  ...(metadata.title ? { title: metadata.title } : {}),
  ...(metadata.startTime ? { startTime: toDateOrNull(metadata.startTime) ?? undefined } : {}),
  ...(metadata.endTime ? { endTime: toDateOrNull(metadata.endTime) ?? undefined } : {}),
  ...(metadata.joinUrl ? { joinUrl: metadata.joinUrl } : {}),
  ...(metadata.organizerEmail ? { organizerEmail: metadata.organizerEmail } : {}),
  ...(metadata.attendees ? { attendees: metadata.attendees } : {}),
  ...(metadata.agenda !== undefined ? { agenda: metadata.agenda ?? null } : {}),
  ...(metadata.persona !== undefined ? { persona: metadata.persona ?? null } : {}),
  ...(metadata.language !== undefined ? { language: metadata.language ?? null } : {}),
  ...(metadata.consentProfile !== undefined
    ? { consentProfile: metadata.consentProfile ?? null }
    : {}),
})

export const meetingRepository = {
  async createMeeting(metadata: MeetingMetadata) {
    return prisma.meeting.create({ data: createMeetingData(metadata) })
  },

  async upsertMetadata(metadata: MeetingMetadata) {
    return prisma.meeting.upsert({
      where: { id: metadata.meetingId },
      update: updateMeetingData(metadata),
      create: createMeetingData(metadata),
    })
  },

  async getMeetingById(meetingId: string) {
    return prisma.meeting.findUnique({ where: { id: meetingId } })
  },

  async getMeetingDetail(meetingId: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        summary: true,
        decisions: {
          include: {
            meeting: {
              select: {
                id: true,
                title: true,
                startTime: true,
                persona: true,
                language: true,
              },
            },
          },
          orderBy: { decidedAt: "desc" },
        },
        actionItems: {
          include: { meeting: { select: { title: true } } },
          orderBy: { createdAt: "desc" },
        },
        briefs: {
          include: { meeting: { select: { title: true } } },
          orderBy: { generatedAt: "desc" },
        },
        stakeholders: true,
        consent: true,
      },
    })

    if (!meeting) return null

    return {
      metadata: mapMetadataFromRecord(meeting),
      summary: meeting.summary ? mapSummaryFromRecord(meeting.summary) : undefined,
      decisions: meeting.decisions.map(mapDecisionFromRecord),
      actionItems: meeting.actionItems.map(mapActionItemFromRecord),
      briefs: meeting.briefs.map(mapBriefFromRecord),
      stakeholders: toStakeholderProfiles(meeting.stakeholders),
      consent: meeting.consent ? mapConsentFromRecord(meeting.consent) : undefined,
    }
  },

  async getMeetingOverview() {
    return prisma.meeting.findMany({
      include: {
        decisions: { select: { id: true } },
        actionItems: { select: { id: true, status: true } },
      },
      orderBy: { startTime: "desc" },
    })
  },

  async updateMeeting(meetingId: string, data: Partial<MeetingMetadata>) {
    return prisma.meeting.update({
      where: { id: meetingId },
      data: updateMeetingData(data),
    })
  },

  async deleteMeeting(meetingId: string) {
    return prisma.meeting.delete({ where: { id: meetingId } })
  },

  async saveSummary(meetingId: string, summary: MeetingSummary) {
    return prisma.meetingSummary.upsert({
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

  async saveBrief(meetingId: string, brief: MeetingBrief) {
    return prisma.meetingBrief.upsert({
      where: { meetingId_type: { meetingId, type: brief.type } },
      create: {
        meetingId,
        type: brief.type,
        generatedAt: toDateOrNull(brief.generatedAt) ?? new Date(),
        subject: brief.subject,
        headline: brief.headline,
        keyPoints: brief.keyPoints,
        decisions: brief.decisions ?? [],
        risks: brief.risks ?? [],
        nextSteps: brief.nextSteps ?? [],
        content: brief.content,
        delivery: brief.delivery ?? [],
      },
      update: {
        generatedAt: toDateOrNull(brief.generatedAt) ?? new Date(),
        subject: brief.subject,
        headline: brief.headline,
        keyPoints: brief.keyPoints,
        decisions: brief.decisions ?? [],
        risks: brief.risks ?? [],
        nextSteps: brief.nextSteps ?? [],
        content: brief.content,
        delivery: brief.delivery ?? [],
      },
    })
  },

  async saveStakeholders(meetingId: string, stakeholders: StakeholderProfile[]) {
    const emails = stakeholders.map((stakeholder) => stakeholder.email)
    await prisma.$transaction([
      prisma.stakeholder.deleteMany({
        where: { meetingId, email: { notIn: emails.length ? emails : ["__never__"] } },
      }),
      ...stakeholders.map((stakeholder) =>
        prisma.stakeholder.upsert({
          where: { meetingId_email: { meetingId, email: stakeholder.email } },
          update: {
            name: stakeholder.name ?? null,
            interests: stakeholder.interests ?? [],
            concerns: stakeholder.concerns ?? [],
            influence: stakeholder.influence,
            preferredPitch: stakeholder.preferredPitch ?? null,
            notes: stakeholder.notes ?? null,
          },
          create: {
            meetingId,
            email: stakeholder.email,
            name: stakeholder.name ?? null,
            interests: stakeholder.interests ?? [],
            concerns: stakeholder.concerns ?? [],
            influence: stakeholder.influence,
            preferredPitch: stakeholder.preferredPitch ?? null,
            notes: stakeholder.notes ?? null,
          },
        }),
      ),
    ])
  },

  async getActionItemById(actionId: string) {
    return prisma.actionItem.findUnique({ where: { id: actionId } })
  },

  async upsertActionItem(action: MeetingActionItem) {
    return prisma.actionItem.upsert({
      where: { id: action.id },
      create: {
        id: action.id,
        meetingId: action.meetingId,
        title: action.title,
        description: action.description,
        owner: action.owner,
        dueDate: toDateOrNull(action.dueDate) ?? undefined,
        source: action.source,
        status: action.status,
        externalLinks: action.externalLinks ?? [],
      },
      update: {
        title: action.title,
        description: action.description,
        owner: action.owner,
        dueDate: toDateOrNull(action.dueDate) ?? undefined,
        source: action.source,
        status: action.status,
        externalLinks: action.externalLinks ?? [],
      },
    })
  },

  async upsertDecisionCard(card: MeetingDecisionCard) {
    return prisma.decisionCard.upsert({
      where: { id: card.id },
      create: {
        id: card.id,
        meetingId: card.meetingId,
        headline: card.headline,
        problem: card.problem,
        alternatives: card.alternatives,
        recommendation: card.recommendation,
        owner: card.owner,
        decidedAt: toDateOrNull(card.decidedAt) ?? new Date(),
        consequences: card.consequences,
        citations: card.citations,
      },
      update: {
        headline: card.headline,
        problem: card.problem,
        alternatives: card.alternatives,
        recommendation: card.recommendation,
        owner: card.owner,
        decidedAt: toDateOrNull(card.decidedAt) ?? new Date(),
        consequences: card.consequences,
        citations: card.citations,
      },
    })
  },

  async saveConsent(meetingId: string, consent: MeetingConsent) {
    return prisma.meetingConsent.upsert({
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

  async getConsent(meetingId: string) {
    const consent = await prisma.meetingConsent.findUnique({ where: { meetingId } })
    return consent ? mapConsentFromRecord(consent) : undefined
  },

  async getRecentDecisionCards(limit = 4) {
    const records = await prisma.decisionCard.findMany({
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            startTime: true,
            persona: true,
            language: true,
          },
        },
      },
      orderBy: { decidedAt: "desc" },
      take: limit,
    })
    return records.map(mapDecisionFromRecord)
  },

  async listDecisionCards(options: {
    limit?: number
    meetingId?: string
    persona?: string | null
    query?: string
  } = {}) {
    const { limit = 25, meetingId, persona, query } = options

    const where: Prisma.DecisionCardWhereInput = {}
    if (meetingId) {
      where.meetingId = meetingId
    }

    const andFilters: Prisma.DecisionCardWhereInput[] = []
    if (persona !== undefined) {
      andFilters.push({ meeting: { persona: { equals: persona } } })
    }

    if (query) {
      andFilters.push({
        OR: [
          { headline: { contains: query, mode: "insensitive" } },
          { problem: { contains: query, mode: "insensitive" } },
          { recommendation: { contains: query, mode: "insensitive" } },
        ],
      })
    }

    if (andFilters.length) {
      where.AND = andFilters
    }

    const records = await prisma.decisionCard.findMany({
      where,
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            startTime: true,
            persona: true,
            language: true,
          },
        },
      },
      orderBy: { decidedAt: "desc" },
      take: limit,
    })

    return records.map(mapDecisionFromRecord)
  },

  async getRecentBriefs(limit = 4) {
    const records = await prisma.meetingBrief.findMany({
      include: { meeting: { select: { title: true } } },
      orderBy: { generatedAt: "desc" },
      take: limit,
    })
    return records.map(mapBriefFromRecord)
  },

  async listBriefs(options: { limit?: number; variant?: "pre" | "post"; query?: string } = {}) {
    const { limit = 25, variant, query } = options

    const where: Prisma.MeetingBriefWhereInput = {}

    if (variant) {
      where.type = variant
    }
    if (query) {
      where.OR = [
        { subject: { contains: query, mode: "insensitive" } },
        { headline: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ]
    }

    const records = await prisma.meetingBrief.findMany({
      where,
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { generatedAt: "desc" },
      take: limit,
    })

    return records.map(mapBriefFromRecord)
  },

  async getRecentActionItems(limit = 5) {
    const records = await prisma.actionItem.findMany({
      include: { meeting: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
    return records.map(mapActionItemFromRecord)
  },
}
