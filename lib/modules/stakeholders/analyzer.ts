import type { MeetingSummary, MeetingTranscriptSegment, StakeholderProfile } from "@/types/meetings"
import { getEventBus } from "@/lib/agents/events"
import { getMeetingById, setStakeholderProfiles } from "@/lib/agents/memory"

const AI_API = process.env.AI_ASSISTANT_API_URL
const AI_API_KEY = process.env.AI_ASSISTANT_API_KEY

interface StakeholderPayload {
  meetingId: string
  attendees: string[]
  organizerEmail: string
  summary?: MeetingSummary
  actionItems?: MeetingSummary["actionItems"]
  decisions?: MeetingSummary["decisions"]
  transcripts?: MeetingTranscriptSegment[]
}

interface AIStakeholderResponse {
  profiles: Array<{
    email: string
    name?: string
    interests?: string[]
    concerns?: string[]
    influence?: "low" | "medium" | "high"
    preferredPitch?: string
    notes?: string
  }>
}

export class StakeholderAnalyzer {
  async run(meetingId: string) {
    const memory = getMeetingById(meetingId)
    if (!memory?.metadata) {
      throw new Error("Meeting metadata saknas för stakeholder-analys")
    }

    const payload: StakeholderPayload = {
      meetingId,
      attendees: memory.metadata.attendees,
      organizerEmail: memory.metadata.organizerEmail,
      summary: memory.summary,
      actionItems: memory.summary?.actionItems,
      decisions: memory.summary?.decisions,
      transcripts: memory.transcript,
    }

    const ai = await this.fetchAI(payload)
    const profiles = ai?.profiles?.length ? ai.profiles.map(this.normalizeProfile) : this.fallback(payload)

    setStakeholderProfiles(meetingId, profiles)

    const bus = getEventBus()
    await bus.publish({
      type: "stakeholder.profile",
      meetingId,
      occurredAt: new Date().toISOString(),
      payload: { profiles },
    })

    return profiles
  }

  private async fetchAI(payload: StakeholderPayload): Promise<AIStakeholderResponse | null> {
    if (!AI_API || !AI_API_KEY) {
      return null
    }

    const response = await fetch(`${AI_API}/stakeholders/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.warn("Stakeholder analyze API misslyckades", await response.text())
      return null
    }

    return (await response.json()) as AIStakeholderResponse
  }

  private normalizeProfile(profile: AIStakeholderResponse["profiles"][number]): StakeholderProfile {
    return {
      email: profile.email,
      name: profile.name,
      interests: profile.interests ?? [],
      concerns: profile.concerns ?? [],
      influence: profile.influence ?? "medium",
      preferredPitch: profile.preferredPitch,
      notes: profile.notes,
    }
  }

  private fallback(payload: StakeholderPayload): StakeholderProfile[] {
    const actionOwners = new Map<string, number>()
    payload.actionItems?.forEach((item) => {
      const key = item.owner.toLowerCase()
      actionOwners.set(key, (actionOwners.get(key) ?? 0) + 1)
    })

    const profiles: StakeholderProfile[] = payload.attendees.map((email) => {
      const key = email.toLowerCase()
      const actionCount = actionOwners.get(key) ?? 0
      const influence = email === payload.organizerEmail ? "high" : actionCount >= 2 ? "high" : actionCount === 1 ? "medium" : "low"

      return {
        email,
        interests: deriveInterests(payload.summary, email),
        concerns: deriveConcerns(payload.summary),
        influence,
        preferredPitch: suggestPitch(influence),
      }
    })

    return profiles
  }
}

const deriveInterests = (summary: MeetingSummary | undefined, email: string) => {
  const interests = new Set<string>()
  summary?.decisions?.forEach((decision) => {
    if (decision.toLowerCase().includes("budget")) interests.add("Ekonomi")
    if (decision.toLowerCase().includes("risk")) interests.add("Risk")
    if (decision.toLowerCase().includes("leverans")) interests.add("Leverans")
  })
  summary?.actionItems.forEach((item) => {
    if (item.owner.toLowerCase() === email.toLowerCase()) {
      interests.add("Ansvar för uppgift")
    }
  })
  return interests.size ? Array.from(interests) : ["Strategi", "Uppföljning"]
}

const deriveConcerns = (summary: MeetingSummary | undefined) => {
  const concerns = new Set<string>()
  summary?.risks?.forEach((risk) => {
    if (risk.toLowerCase().includes("compliance")) concerns.add("Compliance")
    if (risk.toLowerCase().includes("resurs")) concerns.add("Resurser")
  })
  return concerns.size ? Array.from(concerns) : ["Tydlighet i ansvar"]
}

const suggestPitch = (influence: StakeholderProfile["influence"]) => {
  switch (influence) {
    case "high":
      return "Betona riskreduktion, beslutsunderlag och ROI."
    case "medium":
      return "Visa hur uppgiften stöder teamets mål och tidslinjer."
    default:
      return "Lyft fram konkreta nästa steg och hur de kan bidra."
  }
}

export const stakeholderAnalyzer = new StakeholderAnalyzer()
