import type { MeetingBrief, MeetingMetadata } from "@/types/meetings"
import { getEventBus } from "@/lib/agents/events"
import { getMeetingById, getMemoryStore } from "@/lib/agents/memory"
import { env } from "@/lib/config"

const PRE_BRIEF_LEAD_TIME_MS = 30 * 60 * 1000

const preBriefTimers = new Map<string, NodeJS.Timeout>()

export const queuePreBriefGeneration = (metadata: MeetingMetadata) => {
  const start = new Date(metadata.startTime).getTime()
  if (Number.isNaN(start)) return
  const fireAt = start - PRE_BRIEF_LEAD_TIME_MS
  const delay = Math.max(0, fireAt - Date.now())

  if (preBriefTimers.has(metadata.meetingId)) {
    clearTimeout(preBriefTimers.get(metadata.meetingId)!)
  }

  const timer = setTimeout(() => {
    void generatePreBrief(metadata.meetingId).catch((error) => {
      console.error("Pre-brief generation failed", error)
    })
    preBriefTimers.delete(metadata.meetingId)
  }, delay)

  timer.unref?.()
  preBriefTimers.set(metadata.meetingId, timer)
}

export const registerBriefingListeners = () => {
  const bus = getEventBus()

  bus.subscribe("meeting.summary", async (event) => {
    if (event.type !== "meeting.summary") return
    try {
      await generatePostBrief(event.meetingId)
    } catch (error) {
      console.error("Post-brief generation failed", error)
    }
  })
}

const fetchAI = async (payload: Record<string, unknown>, variant: "pre" | "post") => {
  if (!env.AI_ASSISTANT_API_URL || !env.AI_ASSISTANT_API_KEY) {
    throw new Error("AI_ASSISTANT_API_URL och AI_ASSISTANT_API_KEY måste vara satta")
  }

  const response = await fetch(`${env.AI_ASSISTANT_API_URL}/briefings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.AI_ASSISTANT_API_KEY}`,
    },
    body: JSON.stringify({ ...payload, type: variant }),
  })

  if (!response.ok) {
    throw new Error(`Briefing API error ${response.status}: ${await response.text()}`)
  }

  return (await response.json()) as {
    subject: string
    headline: string
    keyPoints: string[]
    decisions?: string[]
    risks?: string[]
    nextSteps?: string[]
    content: string
  }
}

export const generatePreBrief = async (meetingId: string) => {
  const memory = getMeetingById(meetingId)
  if (!memory?.metadata) {
    throw new Error("Meeting metadata saknas")
  }

  const payload = {
    meeting: memory.metadata,
    recentActions: memory.actionItems,
    agenda: memory.metadata.agenda,
  }

  const ai = await safeFetchAI(payload, "pre")

  const brief: MeetingBrief = {
    type: "pre",
    generatedAt: new Date().toISOString(),
    subject: ai.subject ?? `Brief inför ${memory.metadata.title}`,
    headline: ai.headline ?? "Förberedelser inför mötet",
    keyPoints: ai.keyPoints?.length ? ai.keyPoints : buildFallbackPrePoints(payload),
    decisions: ai.decisions,
    risks: ai.risks,
    nextSteps: ai.nextSteps,
    content: ai.content ?? buildFallbackPreBrief(payload),
    delivery: deliverBrief(memory.metadata.organizerEmail),
  }

  const store = getMemoryStore()
  store.setBrief(meetingId, brief)
  await publishBriefEvent(meetingId, brief)
  await maybeSendEmail(brief, memory.metadata)
  return brief
}

export const generatePostBrief = async (meetingId: string) => {
  const memory = getMeetingById(meetingId)
  if (!memory?.metadata || !memory.summary) {
    throw new Error("Meeting summary eller metadata saknas")
  }

  const payload = {
    meeting: memory.metadata,
    summary: memory.summary,
    decisions: memory.decisionCards,
    actionItems: memory.actionItems,
  }

  const ai = await safeFetchAI(payload, "post")

  const brief: MeetingBrief = {
    type: "post",
    generatedAt: new Date().toISOString(),
    subject: ai.subject ?? `Exec-post-brief: ${memory.metadata.title}`,
    headline: ai.headline ?? "Beslut och nästa steg",
    keyPoints: ai.keyPoints?.length ? ai.keyPoints : memory.summary.highlights ?? [],
    decisions: ai.decisions?.length ? ai.decisions : memory.summary.decisions,
    risks: ai.risks?.length ? ai.risks : memory.summary.risks,
    nextSteps:
      ai.nextSteps?.length
        ? ai.nextSteps
        : memory.summary.actionItems.map((item) => `${item.owner}: ${item.description}`),
    content: ai.content ?? buildFallbackPostBrief(payload),
    delivery: deliverBrief(memory.metadata.organizerEmail),
  }

  const store = getMemoryStore()
  store.setBrief(meetingId, brief)
  await publishBriefEvent(meetingId, brief)
  await maybeSendEmail(brief, memory.metadata)
  return brief
}

const safeFetchAI = async (payload: Record<string, unknown>, variant: "pre" | "post") => {
  try {
    return await fetchAI(payload, variant)
  } catch (error) {
    console.warn(`AI brief generation fallback (${variant})`, error)
    return {
      subject: undefined,
      headline: undefined,
      keyPoints: [],
      decisions: [],
      risks: [],
      nextSteps: [],
      content: undefined,
    }
  }
}

const buildFallbackPreBrief = (payload: {
  meeting: MeetingMetadata
  agenda?: string
  recentActions: unknown
}) => {
  const { meeting } = payload
  const lines = [
    `Möte: ${meeting.title} (${meeting.startTime})`,
    meeting.agenda ? `Agenda: ${meeting.agenda}` : "",
    payload.recentActions && Array.isArray(payload.recentActions)
      ? `Öppna actions: ${(payload.recentActions as any[]).length}`
      : "",
  ]
  return lines.filter(Boolean).join("\n") || "Samla teamet och förbered prioriterade punkter."
}

const buildFallbackPrePoints = (payload: {
  meeting: MeetingMetadata
  agenda?: string
  recentActions: unknown
}) => {
  const points: string[] = []
  if (payload.agenda) points.push(`Agenda: ${payload.agenda}`)
  if (Array.isArray(payload.recentActions) && payload.recentActions.length) {
    points.push(`${payload.recentActions.length} öppna åtgärder från tidigare möten.`)
  }
  points.push("Säkerställ att beslutsunderlag och dokumentation finns redo.")
  return points
}

const buildFallbackPostBrief = (payload: Record<string, any>) => {
  const summary = payload.summary
  if (!summary) return "Mötet avslutades – följ upp besluten."
  const decisions = Array.isArray(summary.decisions) ? summary.decisions : []
  const actionItems = Array.isArray(summary.actionItems) ? summary.actionItems : []
  return [
    "Beslut:",
    ...decisions,
    "",
    "Åtgärder:",
    ...actionItems.map((item: any) => `${item.owner}: ${item.description}`),
  ]
    .filter(Boolean)
    .join("\n")
}

const publishBriefEvent = async (meetingId: string, brief: MeetingBrief) => {
  const bus = getEventBus()
  await bus.publish({
    type: "meeting.brief",
    meetingId,
    occurredAt: brief.generatedAt,
    payload: { brief },
  })
}

const deliverBrief = (organizerEmail: string): MeetingBrief["delivery"] => {
  const delivery: MeetingBrief["delivery"] = [{ channel: "api", target: organizerEmail }]
  if (env.MS_GRAPH_SENDMAIL_TOKEN) {
    delivery.push({ channel: "email", target: organizerEmail })
  }
  return delivery
}

const maybeSendEmail = async (brief: MeetingBrief, metadata: MeetingMetadata) => {
  if (!env.MS_GRAPH_SENDMAIL_TOKEN) return
  try {
    await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.MS_GRAPH_SENDMAIL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: brief.subject,
          body: {
            contentType: "HTML",
            content: renderEmail(brief),
          },
          toRecipients: [
            {
              emailAddress: {
                address: metadata.organizerEmail,
              },
            },
          ],
        },
      }),
    })
  } catch (error) {
    console.warn("E-postleverans misslyckades", error)
  }
}

const renderEmail = (brief: MeetingBrief) => {
  const lines = [
    `<h2>${brief.headline}</h2>`,
    `<p>${brief.keyPoints.join("<br>")}</p>`,
  ]
  if (brief.decisions?.length) {
    lines.push("<h3>Beslut</h3>", `<ul>${brief.decisions.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}</ul>`)
  }
  if (brief.risks?.length) {
    lines.push("<h3>Risker</h3>", `<ul>${brief.risks.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>`)
  }
  if (brief.nextSteps?.length) {
    lines.push(
      "<h3>Nästa steg</h3>",
      `<ul>${brief.nextSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ul>`,
    )
  }
  lines.push(`<pre>${escapeHtml(brief.content)}</pre>`)
  return lines.join("")
}

const escapeHtml = (input: string) =>
  input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
