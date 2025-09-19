import { randomUUID } from "node:crypto"

import type { Citation, MeetingDecisionCard, MeetingTranscriptSegment } from "@/types/meetings"
import type { MeetingEvent } from "@/lib/agents/events"
import { getEventBus } from "@/lib/agents/events"
import { meetingRepository } from "@/lib/db/repositories/meetings"

const DECISION_KEYWORDS = ["beslutar", "vi tar", "vi kör", "vi går på", "bestämmer", "choose", "decide"]
const COMMITMENT_KEYWORDS = ["jag tar", "jag fixar", "vi tar", "kan ta", "ansvar", "ownership"]

interface DecisionContext {
  meetingId: string
  segment: MeetingTranscriptSegment
}

const createCitation = (text: string): Citation => ({
  label: "Transkript",
  description: text.slice(0, 120),
})

export const processSegmentForDecision = ({ meetingId, segment }: DecisionContext) => {
  const lowered = segment.text.toLowerCase()
  if (!DECISION_KEYWORDS.some((keyword) => lowered.includes(keyword))) {
    return
  }

  const card: MeetingDecisionCard = {
    id: randomUUID(),
    meetingId,
    headline: extractHeadline(segment.text),
    problem: extractProblem(segment.text),
    alternatives: inferAlternatives(segment.text),
    recommendation: inferRecommendation(segment.text),
    owner: segment.speaker,
    decidedAt: segment.endTime ?? new Date().toISOString(),
    consequences: inferConsequences(segment.text),
    citations: [createCitation(segment.text)],
  }

  const bus = getEventBus()
  void meetingRepository.upsertDecisionCard(card)
  void bus.publish({
    type: "decision.finalized",
    meetingId,
    occurredAt: card.decidedAt,
    payload: card,
  })
}

export const processSegmentForCommitment = ({ meetingId, segment }: DecisionContext) => {
  const lowered = segment.text.toLowerCase()
  if (!COMMITMENT_KEYWORDS.some((keyword) => lowered.includes(keyword))) {
    return
  }

  const bus = getEventBus()
  void bus.publish({
    type: "commitment",
    meetingId,
    occurredAt: segment.endTime ?? new Date().toISOString(),
    payload: {
      statement: segment.text,
      owner: segment.speaker,
      dueDate: extractDueDate(segment.text),
    },
  })
}

const extractHeadline = (text: string) => {
  const match = text.match(/vi (?:beslutar|går på|tar) att (.+)/i)
  if (match?.[1]) return capitalize(match[1])
  return capitalize(text.slice(0, 80))
}

const extractProblem = (text: string) => {
  const match = text.match(/kring (.+?) så (?:behöver|måste)/i)
  if (match?.[1]) return capitalize(match[1])
  return "Frågan diskuterades och kräver beslut."
}

const inferAlternatives = (text: string): MeetingDecisionCard["alternatives"] => {
  const alternatives: MeetingDecisionCard["alternatives"] = []
  const regex = /alternativ\s*A:?\s*(.+?)(?:\.|;|$)/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(text))) {
    const label = match[0].includes("B") ? "B" : "A"
    alternatives.push({ label, description: capitalize(match[1]) })
  }
  if (!alternatives.length) {
    alternatives.push({ label: "A", description: "Genomföra som föreslaget" })
    alternatives.push({ label: "B", description: "Skjuta upp för mer analys" })
  }
  return alternatives
}

const inferRecommendation = (text: string) => {
  const match = text.match(/rekommenderar att (.+)/i)
  if (match?.[1]) return capitalize(match[1])
  return "Gå vidare enligt förslag A och säkerställ uppföljning."
}

const inferConsequences = (text: string) => {
  const consequences: string[] = []
  const match = text.match(/(konsekvens(er)?|innebär att) (.+)/i)
  if (match?.[3]) consequences.push(capitalize(match[3]))
  if (!consequences.length) consequences.push("Förutsätter uppföljning inom 14 dagar.")
  return consequences
}

const extractDueDate = (text: string) => {
  const match = text.match(/(innan|till)\s+(\d{1,2}\s+\w+)/i)
  if (!match?.[2]) return undefined
  const parsed = new Date(`${match[2]} ${new Date().getFullYear()}`)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toISOString()
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

export const registerDecisionSubscribers = () => {
  const bus = getEventBus()
  bus.subscribe("speech.segment", async (event: MeetingEvent) => {
    if (event.type !== "speech.segment") return
    processSegmentForDecision({ meetingId: event.meetingId, segment: event.payload })
    processSegmentForCommitment({ meetingId: event.meetingId, segment: event.payload })
  })
}
