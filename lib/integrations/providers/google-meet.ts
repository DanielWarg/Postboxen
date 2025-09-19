import { ProviderHTTPError, assertEnv, type MeetingProvider } from "./base"
import type {
  MeetingAgentConfig,
  MeetingAgentScheduleRequest,
  MeetingTranscriptSegment,
  ProviderWebhookPayload,
} from "@/types/meetings"

const TOKEN_URL = "https://oauth2.googleapis.com/token"
const CALENDAR_API = "https://www.googleapis.com/calendar/v3"
const MEET_API = "https://meet.googleapis.com/v2"

const getGoogleAccessToken = async (credentials: MeetingAgentConfig["credentials"], scopes?: string) => {
  const refreshToken = credentials.refreshToken ?? assertEnv("GOOGLE_MEET_REFRESH_TOKEN")
  const body = {
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new ProviderHTTPError("Google OAuth misslyckades", response.status, await response.json())
  }

  const json = (await response.json()) as { access_token: string }
  return json.access_token
}

const scheduleMeeting = async (
  config: MeetingAgentConfig,
  payload: MeetingAgentScheduleRequest,
): Promise<{ externalId: string }> => {
  const accessToken = await getGoogleAccessToken(config.credentials)
  const calendarId = config.calendarId ?? payload.organizerEmail

  const body = {
    summary: payload.title,
    description: payload.agenda ?? "Postboxen AI-kollega",
    start: { dateTime: payload.startTime },
    end: { dateTime: payload.endTime },
    attendees: payload.attendees.map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: payload.meetingId,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  }

  const response = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new ProviderHTTPError("Google Calendar kunde inte skapa mötet", response.status, await response.json())
  }

  const json = (await response.json()) as { id: string }
  return { externalId: json.id }
}

const deleteMeeting = async (config: MeetingAgentConfig, meetingId: string) => {
  const accessToken = await getGoogleAccessToken(config.credentials)
  const calendarId = config.calendarId ?? assertEnv("GOOGLE_MEET_CALENDAR_ID")

  const response = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${meetingId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok && response.status !== 404) {
    throw new ProviderHTTPError("Google Calendar kunde inte ta bort mötet", response.status, await response.text())
  }
}

const fetchRecording = async (_config: MeetingAgentConfig, _meetingId: string) => {
  // Google Meet tillhandahåller inte direkt nedladdnings-URL via API ännu.
  return null
}

const fetchTranscript = async (
  config: MeetingAgentConfig,
  meetingCode: string,
): Promise<MeetingTranscriptSegment[]> => {
  const accessToken = await getGoogleAccessToken(config.credentials)
  const response = await fetch(`${MEET_API}/meetings/${meetingCode}/transcripts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (response.status === 404) {
    return []
  }

  if (!response.ok) {
    throw new ProviderHTTPError("Google Meet kunde inte hämta transkript", response.status, await response.text())
  }

  const json = (await response.json()) as {
    transcripts: Array<{
      languageCode: string
      entries: Array<{ startTime: string; endTime: string; text: string; speaker: { displayName: string } }>
    }>
  }

  const segments: MeetingTranscriptSegment[] = []
  for (const transcript of json.transcripts) {
    for (const entry of transcript.entries) {
      segments.push({
        startTime: entry.startTime,
        endTime: entry.endTime,
        speaker: entry.speaker.displayName,
        text: entry.text,
        language: transcript.languageCode,
      })
    }
  }

  return segments
}

const handleWebhook = async (_config: MeetingAgentConfig, payload: ProviderWebhookPayload) => {
  console.info("Google Meet webhook mottagen", payload.event, payload.meetingId)
}

export const googleMeetProvider = (): MeetingProvider => ({
  scheduleAgentMeeting: scheduleMeeting,
  cancelAgentMeeting: deleteMeeting,
  fetchRecording,
  fetchTranscript,
  handleWebhook,
})
