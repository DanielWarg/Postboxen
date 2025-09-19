import { ProviderHTTPError, assertEnv, type MeetingProvider } from "./base"
import type {
  MeetingAgentConfig,
  MeetingAgentScheduleRequest,
  MeetingTranscriptSegment,
  ProviderWebhookPayload,
} from "@/types/meetings"

const GRAPH_BASE = "https://graph.microsoft.com/v1.0"

const getGraphToken = async (credentials: MeetingAgentConfig["credentials"]) => {
  const tenantId = credentials.tenantId ?? assertEnv("MS_TEAMS_TENANT_ID")
  const body = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  })

  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })

  if (!response.ok) {
    throw new ProviderHTTPError("Kunde inte hämta token från Microsoft Graph", response.status, await response.json())
  }

  const json = (await response.json()) as { access_token: string }
  return json.access_token
}

const scheduleMeeting = async (
  config: MeetingAgentConfig,
  payload: MeetingAgentScheduleRequest,
): Promise<{ externalId: string }> => {
  const token = await getGraphToken(config.credentials)
  const url = `${GRAPH_BASE}/users/${encodeURIComponent(payload.organizerEmail)}/onlineMeetings`

  const body = {
    startDateTime: payload.startTime,
    endDateTime: payload.endTime,
    subject: payload.title,
    lobbyBypassSettings: {
      scope: "organization",
    },
    participants: {
      organizer: {
        identity: {
          user: {
            id: payload.organizerEmail,
          },
        },
      },
      attendees: payload.attendees.map((email) => ({
        identity: {
          user: {
            id: email,
          },
        },
      })),
    },
    chatInfo: {
      threadId: payload.meetingId,
      messageId: payload.meetingId,
    },
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new ProviderHTTPError("Microsoft Teams kunde inte skapa mötet", response.status, await response.json())
  }

  const json = (await response.json()) as { id: string }
  return { externalId: json.id }
}

const deleteMeeting = async (config: MeetingAgentConfig, meetingId: string) => {
  const token = await getGraphToken(config.credentials)
  const url = `${GRAPH_BASE}/me/onlineMeetings/${meetingId}`
  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok && response.status !== 404) {
    throw new ProviderHTTPError("Microsoft Teams kunde inte ta bort mötet", response.status, await response.text())
  }
}

const fetchTranscript = async (
  config: MeetingAgentConfig,
  meetingId: string,
): Promise<MeetingTranscriptSegment[]> => {
  const token = await getGraphToken(config.credentials)
  const response = await fetch(`${GRAPH_BASE}/me/onlineMeetings/${meetingId}/transcripts`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new ProviderHTTPError("Microsoft Teams kunde inte hämta transkript", response.status, await response.text())
  }

  const json = (await response.json()) as {
    value: Array<{ id: string; content: string; createdDateTime: string }>
  }

  return json.value.map((entry) => ({
    startTime: entry.createdDateTime,
    endTime: entry.createdDateTime,
    speaker: "unknown",
    text: entry.content,
  }))
}

const fetchRecording = async (config: MeetingAgentConfig, meetingId: string) => {
  const token = await getGraphToken(config.credentials)
  const response = await fetch(`${GRAPH_BASE}/me/onlineMeetings/${meetingId}/recordings`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    if (response.status === 404) return null
    throw new ProviderHTTPError("Microsoft Teams kunde inte hämta inspelning", response.status, await response.text())
  }

  const json = (await response.json()) as {
    value: Array<{ contentUrl: string }>
  }

  const recording = json.value[0]
  if (!recording) return null
  return { downloadUrl: recording.contentUrl }
}

const handleWebhook = async (_config: MeetingAgentConfig, payload: ProviderWebhookPayload) => {
  // Microsoft Graph-subscriptions levererar events här. Avvakta identifierad event och hantera vidare uppströms.
  console.info("Microsoft Teams webhook mottagen", payload.event, payload.meetingId)
}

export const teamsProvider = (): MeetingProvider => ({
  scheduleAgentMeeting: scheduleMeeting,
  cancelAgentMeeting: deleteMeeting,
  fetchRecording,
  fetchTranscript,
  handleWebhook,
})
