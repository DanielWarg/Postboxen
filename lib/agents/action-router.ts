import { randomUUID } from "node:crypto"

import type { MeetingActionItem } from "@/types/meetings"
import type { MeetingEvent } from "@/lib/agents/events"
import { getEventBus } from "@/lib/agents/events"
import { evaluatePolicy } from "@/lib/agents/policy"
import { env } from "@/lib/config"
import { meetingRepository } from "@/lib/db/repositories/meetings"

interface ActionProvider {
  createTask(action: MeetingActionItem): Promise<{ url?: string }>
  sendReminder?(action: MeetingActionItem): Promise<void>
}

class NullProvider implements ActionProvider {
  async createTask() {
    return {}
  }
}

const plannerProvider: ActionProvider = {
  async createTask(action) {
    const token = env.MS_PLANNER_TOKEN
    if (!token) return {}
    const response = await fetch("https://graph.microsoft.com/v1.0/planner/tasks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planId: env.MS_PLANNER_PLAN_ID,
        title: action.title,
        assignments: {},
        dueDateTime: action.dueDate,
        details: {
          description: action.description,
        },
      }),
    })

    if (!response.ok) {
      console.warn("Planner createTask misslyckades", await response.text())
      return {}
    }
    const json = (await response.json()) as { id?: string }
    return { url: json.id ? `https://tasks.office.com/task/${json.id}` : undefined }
  },

  async sendReminder(action) {
    if (!env.MS_GRAPH_SENDMAIL_TOKEN) return
    await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.MS_GRAPH_SENDMAIL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: `Påminnelse: ${action.title}`,
          body: {
            contentType: "Text",
            content: `Hej ${action.owner},\n\nDetta är en vänlig påminnelse om att uppgiften '${action.title}' från möte ${action.meetingId} nu är försenad.\n\nHälsningar, Postboxen AI-kollega`,
          },
          toRecipients: [
            {
              emailAddress: {
                address: `${action.owner}`,
              },
            },
          ],
        },
      }),
    })
  },
}

const jiraProvider: ActionProvider = {
  async createTask(action) {
    const baseUrl = env.JIRA_BASE_URL
    const token = env.JIRA_API_TOKEN
    if (!baseUrl || !token) return {}
    const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          project: { key: env.JIRA_PROJECT_KEY },
          summary: action.title,
          description: action.description,
          duedate: action.dueDate?.split("T")[0],
          issuetype: { name: "Task" },
        },
      }),
    })
    if (!response.ok) {
      console.warn("Jira createTask misslyckades", await response.text())
      return {}
    }
    const json = (await response.json()) as { key?: string }
    return { url: json.key ? `${baseUrl}/browse/${json.key}` : undefined }
  },
}

const trelloProvider: ActionProvider = {
  async createTask(action) {
    const key = env.TRELLO_KEY
    const token = env.TRELLO_TOKEN
    const listId = env.TRELLO_LIST_ID
    if (!key || !token || !listId) return {}

    const params = new URLSearchParams({
      key,
      token,
      idList: listId,
      name: action.title,
      desc: action.description,
      due: action.dueDate ?? "",
    })

    const response = await fetch(`https://api.trello.com/1/cards?${params.toString()}`, {
      method: "POST",
    })

    if (!response.ok) {
      console.warn("Trello createTask misslyckades", await response.text())
      return {}
    }
    const json = (await response.json()) as { url?: string }
    return { url: json.url }
  },
}

const providers: Record<string, ActionProvider> = {
  planner: plannerProvider,
  jira: jiraProvider,
  trello: trelloProvider,
}

const getProviders = (): ActionProvider[] => {
  const active: ActionProvider[] = []
  if (env.MS_PLANNER_PLAN_ID) active.push(providers.planner)
  if (env.JIRA_BASE_URL) active.push(providers.jira)
  if (env.TRELLO_LIST_ID) active.push(providers.trello)
  if (!active.length) active.push(new NullProvider())
  return active
}

const scheduleNudge = (action: MeetingActionItem) => {
  if (!action.dueDate) return
  const due = new Date(action.dueDate).getTime()
  const nudgeAt = due + 1000 * 60 * 60 * 48
  const delay = Math.max(0, nudgeAt - Date.now())
  setTimeout(async () => {
    const dbAction = await meetingRepository.getActionItemById(action.id)
    if (!dbAction || dbAction.status === "done") return

    const hydrated: MeetingActionItem = {
      id: dbAction.id,
      meetingId: dbAction.meetingId,
      title: dbAction.title,
      description: dbAction.description,
      owner: dbAction.owner,
      dueDate: dbAction.dueDate ? dbAction.dueDate.toISOString() : undefined,
      source: dbAction.source as MeetingActionItem["source"],
      status: dbAction.status as MeetingActionItem["status"],
      externalLinks: dbAction.externalLinks as MeetingActionItem["externalLinks"],
    }

    for (const provider of getProviders()) {
      if (provider.sendReminder) {
        await provider.sendReminder(hydrated)
      }
    }
  }, delay).unref()
}

export const registerActionRouter = () => {
  const bus = getEventBus()
  bus.subscribe("commitment", async (event: MeetingEvent) => {
    if (event.type !== "commitment") return

    const action: MeetingActionItem = {
      id: randomUUID(),
      meetingId: event.meetingId,
      title: event.payload.statement.slice(0, 60),
      description: event.payload.statement,
      owner: event.payload.owner,
      dueDate: event.payload.dueDate,
      source: "speech",
      status: "open",
      externalLinks: [],
    }

    const policy = await evaluatePolicy({
      meetingId: event.meetingId,
      dataClass: "action",
      operation: "store",
    })

    if (!policy.allowed) {
      console.warn("Action blockerat av policy", policy.reason)
      return
    }

    for (const provider of getProviders()) {
      const result = await provider.createTask(action)
      if (result.url) {
        action.externalLinks.push({ provider: providerName(provider), url: result.url })
      }
    }

    await meetingRepository.upsertActionItem(action)
    scheduleNudge(action)

    await bus.publish({
      type: "action.created",
      meetingId: event.meetingId,
      occurredAt: action.dueDate ?? new Date().toISOString(),
      payload: action,
    })
  })
}

const providerName = (provider: ActionProvider) => {
  if (provider === providers.planner) return "planner"
  if (provider === providers.jira) return "jira"
  if (provider === providers.trello) return "trello"
  return "planner"
}
