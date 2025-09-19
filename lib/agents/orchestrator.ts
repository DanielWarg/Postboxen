import type {
  MeetingAgentConfig,
  MeetingAgentScheduleRequest,
  MeetingSummary,
  MeetingTranscriptSegment,
  ConsentProfile,
} from "@/types/meetings"
import { resolveProvider } from "@/lib/integrations/providers"
import { getEventBus } from "@/lib/agents/events"
import { getMemoryStore, setMeetingMetadata } from "@/lib/agents/memory"
import { buildConsent, evaluatePolicy } from "@/lib/agents/policy"
import { redactSegments } from "@/lib/agents/redaction"
import { buildCitations } from "@/lib/agents/citations"
import { queuePreBriefGeneration } from "@/lib/agents/briefing"
import { stakeholderAnalyzer } from "@/lib/modules/stakeholders/analyzer"

const AI_API = process.env.AI_ASSISTANT_API_URL
const AI_API_KEY = process.env.AI_ASSISTANT_API_KEY

export class MeetingAgentOrchestrator {
  constructor(private readonly config: MeetingAgentConfig) {
    if (!AI_API || !AI_API_KEY) {
      throw new Error("AI_ASSISTANT_API_URL och AI_ASSISTANT_API_KEY måste vara satta")
    }
  }

  private provider() {
    return resolveProvider(this.config)
  }

  async schedule(payload: MeetingAgentScheduleRequest) {
    const result = await this.provider().scheduleAgentMeeting(this.config, payload)
    let consent
    if (payload.consentProfile) {
      consent = buildConsent(payload.meetingId, payload.consentProfile as ConsentProfile, new Date().toISOString())
      const bus = getEventBus()
      await bus.publish({
        type: "meeting.consent",
        meetingId: payload.meetingId,
        occurredAt: consent.acceptedAt,
        payload: consent,
      })
    }
    const metadata = {
      meetingId: payload.meetingId,
      title: payload.title,
      startTime: payload.startTime,
      endTime: payload.endTime,
      joinUrl: payload.joinUrl,
      organizerEmail: payload.organizerEmail,
      attendees: payload.attendees,
      agenda: payload.agenda,
      persona: payload.persona,
      language: payload.language,
    }
    setMeetingMetadata(metadata)
    queuePreBriefGeneration(metadata)
    return { ...result, consent }
  }

  async cancel(meetingId: string) {
    return this.provider().cancelAgentMeeting(this.config, meetingId)
  }

  async syncRecording(meetingId: string) {
    const policy = evaluatePolicy({
      meetingId,
      dataClass: "recording",
      operation: "process",
      targetRegion: this.config.locale?.startsWith("sv") ? "eu" : undefined,
    })
    if (!policy.allowed) {
      throw new Error(`Policy blocker: ${policy.reason}`)
    }
    return this.provider().fetchRecording(this.config, meetingId)
  }

  async transcripts(meetingId: string) {
    const policy = evaluatePolicy({
      meetingId,
      dataClass: "transcript",
      operation: "process",
      targetRegion: this.config.locale?.startsWith("sv") ? "eu" : undefined,
    })
    if (!policy.allowed) {
      throw new Error(`Policy blocker: ${policy.reason}`)
    }

    const raw = await this.provider().fetchTranscript(this.config, meetingId)
    const segments = redactSegments(raw)
    this.publishSegments(meetingId, segments)
    return segments
  }

  async summarize(meetingId: string): Promise<MeetingSummary> {
    const [transcripts, recording] = await Promise.all([
      this.transcripts(meetingId),
      this.syncRecording(meetingId),
    ])

    const citations = buildCitations({
      meetingId,
      persona: this.config.persona,
      segments: transcripts,
    })

    const response = await fetch(`${AI_API}/summaries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        meetingId,
        platform: this.config.platform,
        transcript: transcripts,
        recording,
        citations,
        persona: this.config.persona,
        locale: this.config.locale ?? "sv-SE",
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`AI-sammanfattning misslyckades (${response.status}): ${errorBody}`)
    }
    const summary = (await response.json()) as MeetingSummary
    summary.citations = summary.citations?.length ? summary.citations : citations

    const memory = getMemoryStore()
    memory.setSummary(meetingId, summary)

    const bus = getEventBus()
    await bus.publish({
      type: "meeting.summary",
      meetingId,
      occurredAt: new Date().toISOString(),
      payload: summary,
    })

    void stakeholderAnalyzer
      .run(meetingId)
      .catch((error) => console.error("Stakeholder-analys misslyckades", error))

    return summary
  }

  private publishSegments(meetingId: string, segments: MeetingTranscriptSegment[]) {
    const bus = getEventBus()
    const memory = getMemoryStore()
    for (const segment of segments) {
      memory.appendTranscript(meetingId, segment)
      void bus.publish({
        type: "speech.segment",
        meetingId,
        occurredAt: segment.startTime,
        payload: segment,
      })
    }
  }
}

export const createAgent = (config: MeetingAgentConfig) => new MeetingAgentOrchestrator(config)
