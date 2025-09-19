import { ProviderHTTPError, type MeetingProvider } from "./base"
import type {
  MeetingAgentConfig,
  MeetingAgentScheduleRequest,
  MeetingTranscriptSegment,
  ProviderWebhookPayload,
} from "@/types/meetings"

const WEBEX_API = "https://webexapis.com/v1"

const getWebexToken = async (credentials: MeetingAgentConfig["credentials"]) => {
  if (credentials.accessToken) {
    return credentials.accessToken
  }

  if (!credentials.refreshToken) {
    throw new Error("Webex kräver accessToken eller refreshToken")
  }

  const response = await fetch("https://webexapis.com/v1/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: credentials.refreshToken,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
    }),
  })

  if (!response.ok) {
    throw new ProviderHTTPError("Webex OAuth misslyckades", response.status, await response.json())
  }

  const json = (await response.json()) as { access_token: string }
  return json.access_token
}

const scheduleMeeting = async (
  config: MeetingAgentConfig,
  payload: MeetingAgentScheduleRequest,
): Promise<{ externalId: string }> => {
  const token = await getWebexToken(config.credentials)

  const body = {
    title: payload.title,
    start: payload.startTime,
    end: payload.endTime,
    timezone: config.timezone ?? "Europe/Stockholm",
    enabledAutoRecordMeeting: Boolean(payload.recordingConsent),
    invitees: payload.attendees.map((email) => ({ email })),
    agenda: payload.agenda,
  }

  const response = await fetch(`${WEBEX_API}/meetings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new ProviderHTTPError("Webex kunde inte skapa mötet", response.status, await response.json())
  }

  const json = (await response.json()) as { id: string }
  return { externalId: json.id }
}

const deleteMeeting = async (config: MeetingAgentConfig, meetingId: string) => {
  const token = await getWebexToken(config.credentials)
  const response = await fetch(`${WEBEX_API}/meetings/${meetingId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok && response.status !== 404) {
    throw new ProviderHTTPError("Webex kunde inte ta bort mötet", response.status, await response.text())
  }
}

const fetchRecording = async (config: MeetingAgentConfig, meetingId: string) => {
  const token = await getWebexToken(config.credentials)
  const response = await fetch(`${WEBEX_API}/recordings?meetingId=${meetingId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new ProviderHTTPError("Webex kunde inte hämta inspelning", response.status, await response.text())
  }

  const json = (await response.json()) as {
    items: Array<{ downloadUrl: string }>
  }

  const recording = json.items[0]
  if (!recording) return null
  return { downloadUrl: recording.downloadUrl }
}

const fetchTranscript = async (
  config: MeetingAgentConfig,
  meetingId: string,
): Promise<MeetingTranscriptSegment[]> => {
  const token = await getWebexToken(config.credentials)
  const response = await fetch(`${WEBEX_API}/meetingTranscripts?meetingId=${meetingId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (response.status === 404) {
    return []
  }

  if (!response.ok) {
    throw new ProviderHTTPError("Webex kunde inte hämta transkript", response.status, await response.text())
  }

  const json = (await response.json()) as {
    items: Array<{ segments: Array<{ speaker: string; startTime: string; endTime: string; text: string }> }>
  }

  return json.items.flatMap((item) =>
    item.segments.map((segment) => ({
      speaker: segment.speaker,
      startTime: segment.startTime,
      endTime: segment.endTime,
      text: segment.text,
    })),
  )
}

const handleWebhook = async (_config: MeetingAgentConfig, payload: ProviderWebhookPayload) => {
  console.info("Webex webhook mottagen", payload.event, payload.meetingId)
}

export const webexProvider = (): MeetingProvider => ({
  scheduleAgentMeeting: scheduleMeeting,
  cancelAgentMeeting: deleteMeeting,
  fetchRecording,
  fetchTranscript,
  handleWebhook,
})
