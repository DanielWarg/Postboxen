import { Buffer } from "node:buffer"

import type { MeetingConsent, MeetingEvent } from "@/types/meetings"
import { getEventBus } from "@/lib/agents/events"
import { auditRepository } from "@/lib/db/repositories/audit"

interface AuditEntry {
  meetingId?: string
  event: string
  payload: unknown
  occurredAt: string
  policy?: string
}

export const recordAudit = (entry: AuditEntry) => {
  void auditRepository.record({
    meetingId: entry.meetingId,
    event: entry.event,
    payload: entry.payload,
    policy: entry.policy,
    occurredAt: new Date(entry.occurredAt),
  })
}

export const listAuditEntries = async (meetingId?: string) => {
  if (!meetingId) return []
  const entries = await auditRepository.listForMeeting(meetingId)
  return entries.map((entry) => ({
    id: entry.id,
    meetingId: entry.meetingId ?? undefined,
    event: entry.event,
    payload: entry.payload,
    policy: entry.policy ?? undefined,
    occurredAt: entry.occurredAt.toISOString(),
  }))
}

export const getAuditForMeeting = (meetingId: string) => listAuditEntries(meetingId)

export const consentReceipt = (meetingId: string, consent: MeetingConsent) => ({
  meetingId,
  consent,
  issuedAt: new Date().toISOString(),
  signature: Buffer.from(`${meetingId}:${consent.acceptedAt}:${consent.profile}`).toString("base64"),
})

export const registerAuditListeners = () => {
  const bus = getEventBus()

  bus.subscribe("meeting.consent", (event: MeetingEvent) => {
    if (event.type !== "meeting.consent") return
    recordAudit({
      meetingId: event.meetingId,
      event: event.type,
      payload: event.payload,
      occurredAt: event.occurredAt,
      policy: "consent",
    })
  })

  bus.subscribe("decision.finalized", (event: MeetingEvent) => {
    if (event.type !== "decision.finalized") return
    recordAudit({
      meetingId: event.meetingId,
      event: event.type,
      payload: event.payload,
      occurredAt: event.occurredAt,
      policy: "decision",
    })
  })

  bus.subscribe("action.created", (event: MeetingEvent) => {
    if (event.type !== "action.created") return
    recordAudit({
      meetingId: event.meetingId,
      event: event.type,
      payload: event.payload,
      occurredAt: event.occurredAt,
      policy: "action",
    })
  })
}
