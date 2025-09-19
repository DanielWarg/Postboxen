import { randomUUID } from "node:crypto"

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

interface MeetingMemory {
  createdAt: number
  expiresAt: number
  consent?: MeetingConsent
  transcript: MeetingTranscriptSegment[]
  decisionCards: MeetingDecisionCard[]
  actionItems: MeetingActionItem[]
  summary?: MeetingSummary
  events: MeetingEvent[]
  metadata?: MeetingMetadata
  briefs: {
    pre?: MeetingBrief
    post?: MeetingBrief
  }
  stakeholders: StakeholderProfile[]
}

const DEFAULT_TTL_MS = parseInt(process.env.MEMORY_DEFAULT_TTL_MS ?? "86400000", 10) // 24h

class MemoryStore {
  private cache = new Map<string, MeetingMemory>()

  private ensure(meetingId: string) {
    const existing = this.cache.get(meetingId)
    if (existing && existing.expiresAt > Date.now()) {
      return existing
    }
    const ttlMs = DEFAULT_TTL_MS
    const entry: MeetingMemory = {
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      transcript: [],
      decisionCards: [],
      actionItems: [],
      events: [],
      briefs: {},
      stakeholders: [],
    }
    this.cache.set(meetingId, entry)
    return entry
  }

  appendTranscript(meetingId: string, segment: MeetingTranscriptSegment) {
    const entry = this.ensure(meetingId)
    entry.transcript.push(segment)
  }

  appendDecision(meetingId: string, card: MeetingDecisionCard) {
    const entry = this.ensure(meetingId)
    entry.decisionCards = upsertById(entry.decisionCards, card)
  }

  appendAction(meetingId: string, action: MeetingActionItem) {
    const entry = this.ensure(meetingId)
    entry.actionItems = upsertById(entry.actionItems, action)
  }

  setConsent(meetingId: string, consent: MeetingConsent) {
    const entry = this.ensure(meetingId)
    entry.consent = consent
  }

  setSummary(meetingId: string, summary: MeetingSummary) {
    const entry = this.ensure(meetingId)
    entry.summary = summary
  }

  setMetadata(meetingId: string, metadata: MeetingMetadata) {
    const entry = this.ensure(meetingId)
    entry.metadata = metadata
  }

  setBrief(meetingId: string, brief: MeetingBrief) {
    const entry = this.ensure(meetingId)
    entry.briefs = {
      ...entry.briefs,
      [brief.type]: brief,
    }
  }

  setStakeholders(meetingId: string, stakeholders: StakeholderProfile[]) {
    const entry = this.ensure(meetingId)
    entry.stakeholders = stakeholders
  }

  appendEvent(meetingId: string, event: MeetingEvent) {
    const entry = this.ensure(meetingId)
    entry.events.push(event)
  }

  getMeeting(meetingId: string) {
    return this.cache.get(meetingId)
  }

  listMeetings() {
    return Array.from(this.cache.entries()).map(([id, mem]) => ({
      meetingId: id,
      createdAt: mem.createdAt,
      expiresAt: mem.expiresAt,
      decisionCount: mem.decisionCards.length,
      actionCount: mem.actionItems.length,
      startTime: mem.metadata?.startTime,
      title: mem.metadata?.title,
    }))
  }

  purgeExpired() {
    const now = Date.now()
    for (const [id, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(id)
      }
    }
  }
}

const upsertById = <T extends { id: string }>(list: T[], item: T): T[] => {
  const idx = list.findIndex((entry) => entry.id === item.id)
  if (idx === -1) {
    return [...list, item]
  }
  const clone = [...list]
  clone[idx] = item
  return clone
}

let store: MemoryStore | undefined

export const getMemoryStore = () => {
  if (!store) {
    store = new MemoryStore()
    setInterval(() => store?.purgeExpired(), 60_000).unref()
  }
  return store
}

export const createEphemeralId = () => randomUUID()

export const getMeetingById = (meetingId: string) => getMemoryStore().getMeeting(meetingId)
export const setMeetingMetadata = (metadata: MeetingMetadata) => getMemoryStore().setMetadata(metadata.meetingId, metadata)
export const setStakeholderProfiles = (meetingId: string, stakeholders: StakeholderProfile[]) =>
  getMemoryStore().setStakeholders(meetingId, stakeholders)
