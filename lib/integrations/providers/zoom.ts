import { Buffer } from "node:buffer"

import { ProviderHTTPError, type MeetingProvider } from "./base"
import type {
  MeetingAgentConfig,
  MeetingAgentScheduleRequest,
  MeetingTranscriptSegment,
  ProviderWebhookPayload,
} from "@/types/meetings"

const ZOOM_API = "https://api.zoom.us/v2"
const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token"

const getZoomToken = async (credentials: MeetingAgentConfig["credentials"]) => {
  if (!credentials.accountId) {
    throw new Error("Zoom kräver accountId i credentials")
  }

  const auth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64")
  const response = await fetch(
    `${ZOOM_TOKEN_URL}?grant_type=account_credentials&account_id=${credentials.accountId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    },
  )

  if (!response.ok) {
    throw new ProviderHTTPError("Kunde inte hämta token från Zoom", response.status, await response.json())
  }

  const json = (await response.json()) as { access_token: string }
  return json.access_token
}

const scheduleMeeting = async (
  config: MeetingAgentConfig,
  payload: MeetingAgentScheduleRequest,
): Promise<{ externalId: string }> => {
  const token = await getZoomToken(config.credentials)
  const url = `${ZOOM_API}/users/${encodeURIComponent(payload.organizerEmail)}/meetings`

  const body = {
    topic: payload.title,
    type: 2,
    start_time: payload.startTime,
    duration: Math.max(15, Math.round((new Date(payload.endTime).getTime() - new Date(payload.startTime).getTime()) / 60000)),
    timezone: config.timezone ?? "Europe/Stockholm",
    agenda: payload.agenda ?? "Postboxen AI-kollega möte",
    settings: {
      auto_recording: payload.recordingConsent ? "cloud" : "none",
      alternative_hosts: payload.attendees.join(","),
      waiting_room: false,
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
    throw new ProviderHTTPError("Zoom kunde inte skapa mötet", response.status, await response.json())
  }

  const json = (await response.json()) as { id: number }
  return { externalId: String(json.id) }
}

const deleteMeeting = async (config: MeetingAgentConfig, meetingId: string) => {
  const token = await getZoomToken(config.credentials)
  const response = await fetch(`${ZOOM_API}/meetings/${meetingId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok && response.status !== 404) {
    throw new ProviderHTTPError("Zoom kunde inte ta bort mötet", response.status, await response.text())
  }
}

const fetchRecording = async (config: MeetingAgentConfig, meetingId: string) => {
  const token = await getZoomToken(config.credentials)
  const response = await fetch(`${ZOOM_API}/meetings/${meetingId}/recordings`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (response.status === 404) return null

  if (!response.ok) {
    throw new ProviderHTTPError("Zoom kunde inte hämta inspelning", response.status, await response.json())
  }

  const json = (await response.json()) as {
    recording_files: Array<{ download_url: string; status: string }>
  }

  const completed = json.recording_files.find((file) => file.status === "completed")
  if (!completed) return null
  return { downloadUrl: `${completed.download_url}?access_token=${await getZoomToken(config.credentials)}` }
}

const fetchTranscript = async (
  config: MeetingAgentConfig,
  meetingId: string,
): Promise<MeetingTranscriptSegment[]> => {
  const token = await getZoomToken(config.credentials)
  const response = await fetch(`${ZOOM_API}/meetings/${meetingId}/transcriptions`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (response.status === 404) {
    return []
  }

  if (!response.ok) {
    throw new ProviderHTTPError("Zoom kunde inte hämta transkript", response.status, await response.text())
  }

  const json = (await response.json()) as {
    transcripts: Array<{ speaker: string; text: string; start_time: string; end_time: string }>
  }

  return json.transcripts.map((segment) => ({
    speaker: segment.speaker,
    text: segment.text,
    startTime: segment.start_time,
    endTime: segment.end_time,
  }))
}

const handleWebhook = async (_config: MeetingAgentConfig, payload: ProviderWebhookPayload) => {
  console.info("Zoom webhook mottagen", payload.event, payload.meetingId)
}

export const zoomProvider = (): MeetingProvider => ({
  scheduleAgentMeeting: scheduleMeeting,
  cancelAgentMeeting: deleteMeeting,
  fetchRecording,
  fetchTranscript,
  handleWebhook,
})
