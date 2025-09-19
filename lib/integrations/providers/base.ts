import type {
  MeetingAgentConfig,
  MeetingAgentScheduleRequest,
  MeetingSummary,
  MeetingTranscriptSegment,
  ProviderWebhookPayload,
} from "@/types/meetings"

export interface MeetingProvider {
  scheduleAgentMeeting(config: MeetingAgentConfig, payload: MeetingAgentScheduleRequest): Promise<{ externalId: string }>
  cancelAgentMeeting(config: MeetingAgentConfig, meetingId: string): Promise<void>
  fetchRecording(config: MeetingAgentConfig, meetingId: string): Promise<{ downloadUrl: string } | null>
  fetchTranscript(config: MeetingAgentConfig, meetingId: string): Promise<MeetingTranscriptSegment[]>
  handleWebhook(config: MeetingAgentConfig, payload: ProviderWebhookPayload): Promise<void>
}

export class ProviderHTTPError extends Error {
  constructor(
    message: string,
    public status: number,
    public responseBody: unknown,
  ) {
    super(message)
    this.name = "ProviderHTTPError"
  }
}

export const assertEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Miljövariabeln ${name} saknas – kontrollera .env.local`)
  }
  return value
}

export type MeetingProviderFactory = () => MeetingProvider
