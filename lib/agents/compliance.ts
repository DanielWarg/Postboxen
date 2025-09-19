import { Buffer } from "node:buffer"

import type { MeetingConsent, MeetingEvent } from "@/types/meetings"
import { getEventBus } from "@/lib/agents/events"

interface AuditEntry {
  meetingId: string
  event: string
  payload: unknown
  occurredAt: string
  policy?: string
}

class AuditLog {
  private entries: AuditEntry[] = []

  add(entry: AuditEntry) {
    this.entries.push(entry)
    if (this.entries.length > 10_000) {
      this.entries.shift()
    }
  }

  list(meetingId?: string) {
    return meetingId ? this.entries.filter((entry) => entry.meetingId === meetingId) : [...this.entries]
  }
}

const auditLog = new AuditLog()

export const recordAudit = (entry: AuditEntry) => {
  auditLog.add(entry)
}

export const listAuditEntries = (meetingId?: string) => auditLog.list(meetingId)

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
