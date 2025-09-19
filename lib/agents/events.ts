import { setTimeout as delay } from "node:timers/promises"

import type {
  MeetingActionItem,
  MeetingConsent,
  MeetingDecisionCard,
  MeetingTranscriptSegment,
  MeetingBrief,
  StakeholderProfile,
} from "@/types/meetings"
import type { RegulationWatchResult } from "@/types/regwatch"
import { getMemoryStore } from "@/lib/agents/memory"

export type MeetingEventType =
  | "speech.segment"
  | "decision.cue"
  | "decision.finalized"
  | "commitment"
  | "action.created"
  | "meeting.consent"
  | "meeting.summary"
  | "meeting.brief"
  | "procurement.simulation"
  | "stakeholder.profile"
  | "regulation.change"

export interface MeetingEventBase {
  meetingId: string
  occurredAt: string
  correlationId?: string
}

export type MeetingEvent =
  | (MeetingEventBase & { type: "speech.segment"; payload: MeetingTranscriptSegment })
  | (MeetingEventBase & {
      type: "decision.cue"
      payload: { utterance: string; speaker: string }
    })
  | (MeetingEventBase & { type: "decision.finalized"; payload: MeetingDecisionCard })
  | (MeetingEventBase & {
      type: "commitment"
      payload: { statement: string; owner: string; dueDate?: string }
    })
  | (MeetingEventBase & { type: "action.created"; payload: MeetingActionItem })
  | (MeetingEventBase & { type: "meeting.consent"; payload: MeetingConsent })
  | (MeetingEventBase & { type: "meeting.summary"; payload: unknown })
  | (MeetingEventBase & { type: "meeting.brief"; payload: { brief: MeetingBrief } })
  | (MeetingEventBase & { type: "procurement.simulation"; payload: unknown })
  | (MeetingEventBase & { type: "stakeholder.profile"; payload: { profiles: StakeholderProfile[] } })
  | (MeetingEventBase & { type: "regulation.change"; payload: RegulationWatchResult })

export type EventHandler<T extends MeetingEvent = MeetingEvent> = (event: T) => Promise<void> | void

class InMemoryEventBus {
  private subscribers = new Map<MeetingEventType, Set<EventHandler>>()
  private replayBuffer = new Map<string, MeetingEvent[]>()

  subscribe<T extends MeetingEvent>(type: T["type"], handler: EventHandler<T>) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set())
    }
    this.subscribers.get(type)?.add(handler as EventHandler)
  }

  unsubscribe<T extends MeetingEvent>(type: T["type"], handler: EventHandler<T>) {
    this.subscribers.get(type)?.delete(handler as EventHandler)
  }

  async publish(event: MeetingEvent) {
    const handlers = Array.from(this.subscribers.get(event.type) ?? [])
    this.persist(event)

    for (const handler of handlers) {
      await handler(event)
    }
  }

  private persist(event: MeetingEvent) {
    const store = getMemoryStore()
    store.appendEvent(event.meetingId, event)

    const list = this.replayBuffer.get(event.meetingId) ?? []
    list.push(event)
    this.replayBuffer.set(event.meetingId, list.slice(-500))
  }

  async replay(meetingId: string, handler: EventHandler) {
    const events = this.replayBuffer.get(meetingId) ?? []
    for (const event of events) {
      await handler(event)
      await delay(0)
    }
  }
}

let bus: InMemoryEventBus | undefined

export const getEventBus = () => {
  if (!bus) {
    bus = new InMemoryEventBus()
  }
  return bus
}
