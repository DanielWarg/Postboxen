export type MeetingPlatform = "microsoft-teams" | "zoom" | "google-meet" | "webex"

export interface ProviderCredentials {
  clientId: string
  clientSecret: string
  tenantId?: string
  accountId?: string
  refreshToken?: string
  accessToken?: string
}

export interface MeetingAgentConfig {
  platform: MeetingPlatform
  credentials: ProviderCredentials
  calendarId?: string
  locale?: string
  timezone?: string
  persona?: string
}

export interface MeetingAgentScheduleRequest {
  meetingId: string
  title: string
  startTime: string // ISO 8601
  endTime: string // ISO 8601
  joinUrl: string
  organizerEmail: string
  attendees: string[]
  agenda?: string
  persona?: string
  language?: string
  recordingConsent?: boolean
  consentProfile?: ConsentProfile
}

export interface MeetingMetadata {
  meetingId: string
  title: string
  startTime: string
  endTime: string
  joinUrl: string
  organizerEmail: string
  attendees: string[]
  agenda?: string
  persona?: string
  language?: string
  consentProfile?: string
}

export interface MeetingBrief {
  type: "pre" | "post"
  generatedAt: string
  subject: string
  headline: string
  keyPoints: string[]
  decisions?: string[]
  risks?: string[]
  nextSteps?: string[]
  delivery?: Array<{
    channel: "email" | "api"
    target: string
  }>
  content: string
}

export type ConsentProfile = "bas" | "plus" | "juridik"

export interface MeetingConsent {
  profile: ConsentProfile
  acceptedAt: string
  scope: Array<"audio" | "video" | "chat" | "screen" | "documents">
  retentionDays: number
  dataResidency: "eu" | "customer" | "global"
}

export interface MeetingDecisionCard {
  id: string
  meetingId: string
  headline: string
  problem: string
  alternatives: Array<{ label: string; description: string }>
  recommendation: string
  owner: string
  decidedAt: string
  consequences: string[]
  citations: Citation[]
}

export interface MeetingActionItem {
  id: string
  meetingId: string
  title: string
  description: string
  owner: string
  dueDate?: string
  source: "speech" | "chat" | "decision-card"
  externalLinks: Array<{ provider: "planner" | "jira" | "trello"; url: string }>
  status: "open" | "in-progress" | "done" | "overdue"
}

export interface Citation {
  label: string
  description: string
  url?: string
  law?: string
  article?: string
  version?: string
  publishedAt?: string
}

export interface MeetingTranscriptSegment {
  startTime: string
  endTime: string
  speaker: string
  text: string
  language?: string
}

export interface MeetingSummary {
  meetingId: string
  decisions: string[]
  actionItems: Array<{
    owner: string
    description: string
    due?: string
  }>
  risks: string[]
  highlights: string[]
  languages: string[]
  citations: Citation[]
}

export interface StakeholderProfile {
  email: string
  name?: string
  interests: string[]
  concerns: string[]
  influence: "low" | "medium" | "high"
  preferredPitch?: string
  notes?: string
}

export interface ProviderWebhookPayload {
  meetingId: string
  event: string
  data: unknown
}
