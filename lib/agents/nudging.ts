import { Job } from "bullmq"
import { addNotificationJob } from "@/lib/queues"
import { createLogger } from "@/lib/observability/logger"
import { reportAgentError } from "@/lib/observability/sentry"

export interface NudgingJobData {
  meetingId: string
  userId: string
  userEmail: string
  nudgingType: "follow_up" | "deadline_reminder" | "action_required" | "meeting_prep"
  config: {
    delay?: number // milliseconds
    maxAttempts?: number
    template?: string
    priority?: "low" | "medium" | "high"
  }
}

export interface NotificationJobData {
  userId: string
  recipients: string[]
  type: "email" | "teams" | "slack" | "push"
  template: string
  data: {
    subject: string
    body: string
    meetingId?: string
    actionUrl?: string
    priority?: "low" | "medium" | "high"
  }
}

// Nudging templates
const nudgingTemplates = {
  follow_up: {
    subject: "Följ upp på möte {{meetingTitle}}",
    body: "Hej {{userName}}!\n\nDet har gått {{daysSinceMeeting}} dagar sedan mötet '{{meetingTitle}}'. Kom ihåg att:\n\n{{actionItems}}\n\nKlicka här för att se alla detaljer: {{meetingUrl}}",
    priority: "medium" as const,
  },
  deadline_reminder: {
    subject: "Deadline närmar sig för {{actionTitle}}",
    body: "Hej {{userName}}!\n\nDeadlinen för '{{actionTitle}}' är {{daysUntilDeadline}} dagar bort.\n\nStatus: {{actionStatus}}\n\nKlicka här för att uppdatera: {{actionUrl}}",
    priority: "high" as const,
  },
  action_required: {
    subject: "Åtgärd krävs för {{meetingTitle}}",
    body: "Hej {{userName}}!\n\nDu har {{pendingActions}} väntande åtgärder från mötet '{{meetingTitle}}'.\n\n{{actionList}}\n\nKlicka här för att hantera: {{meetingUrl}}",
    priority: "high" as const,
  },
  meeting_prep: {
    subject: "Förberedelse för möte {{meetingTitle}}",
    body: "Hej {{userName}}!\n\nMötet '{{meetingTitle}}' börjar om {{hoursUntilMeeting}} timmar.\n\nAgenda:\n{{agenda}}\n\nFörberedelser:\n{{preparations}}\n\nKlicka här för att gå till mötet: {{meetingUrl}}",
    priority: "medium" as const,
  },
}

// Process nudging job
export const processNudgingJob = async (job: Job<NudgingJobData>) => {
  const { meetingId, userId, userEmail, nudgingType, config } = job.data
  const logger = createLogger()
  
  logger.info(`Processing nudging job for meeting ${meetingId}`, {
    nudgingType,
    userId,
    config,
  })

  try {
    // Get template for nudging type
    const template = nudgingTemplates[nudgingType]
    if (!template) {
      throw new Error(`Unknown nudging type: ${nudgingType}`)
    }

    // Simulate fetching meeting data (in production, this would come from database)
    const meetingData = await getMeetingData(meetingId)
    const userData = await getUserData(userId)
    const actionData = await getActionData(meetingId)

    // Render template with data
    const renderedSubject = renderTemplate(template.subject, {
      meetingTitle: meetingData.title,
      userName: userData.name,
      actionTitle: actionData?.title || "Åtgärd",
      daysSinceMeeting: actionData?.daysSinceMeeting || 0,
      daysUntilDeadline: actionData?.daysUntilDeadline || 0,
      hoursUntilMeeting: actionData?.hoursUntilMeeting || 0,
    })

    const renderedBody = renderTemplate(template.body, {
      meetingTitle: meetingData.title,
      userName: userData.name,
      actionItems: actionData?.items?.join("\n- ") || "Inga åtgärder",
      actionList: actionData?.items?.join("\n- ") || "Inga åtgärder",
      pendingActions: actionData?.count || 0,
      agenda: meetingData.agenda || "Ingen agenda",
      preparations: meetingData.preparations || "Inga förberedelser",
      meetingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/agents/meetings/${meetingId}`,
      actionUrl: actionData?.url || "",
    })

    // Schedule notification
    await addNotificationJob(userId, [userEmail], "email", nudgingType, {
      subject: renderedSubject,
      body: renderedBody,
      meetingId,
      actionUrl: actionData?.url,
      priority: template.priority,
    })

    logger.info(`Nudging job completed for meeting ${meetingId}`, {
      nudgingType,
      notificationScheduled: true,
    })

    return {
      success: true,
      meetingId,
      nudgingType,
      notificationScheduled: true,
    }

  } catch (error) {
    logger.error(`Nudging job failed for meeting ${meetingId}`, error as Error)
    reportAgentError("nudging", meetingId, error as Error)
    throw error
  }
}

// Process notification job
export const processNotificationJob = async (job: Job<NotificationJobData>) => {
  const { userId, recipients, type, template, data } = job.data
  const logger = createLogger()
  
  logger.info(`Processing notification job for user ${userId}`, {
    type,
    template,
    recipients: recipients.length,
  })

  try {
    // Simulate sending notification based on type
    switch (type) {
      case "email":
        await sendEmailNotification(recipients, data)
        break
      case "teams":
        await sendTeamsNotification(recipients, data)
        break
      case "slack":
        await sendSlackNotification(recipients, data)
        break
      case "push":
        await sendPushNotification(recipients, data)
        break
      default:
        throw new Error(`Unknown notification type: ${type}`)
    }

    logger.info(`Notification sent successfully`, {
      userId,
      type,
      recipients: recipients.length,
    })

    return {
      success: true,
      userId,
      type,
      recipientsSent: recipients.length,
    }

  } catch (error) {
    logger.error(`Notification job failed for user ${userId}`, error as Error)
    reportAgentError("notification", userId, error as Error)
    throw error
  }
}

// Helper functions (simplified for now)
async function getMeetingData(meetingId: string) {
  // In production, fetch from database
  return {
    title: `Möte ${meetingId}`,
    agenda: "Diskussion av projektstatus",
    preparations: "Läs igenom dokument",
  }
}

async function getUserData(userId: string) {
  // In production, fetch from user service
  return {
    name: "Användare",
    email: "user@example.com",
  }
}

async function getActionData(meetingId: string) {
  // In production, fetch from database
  return {
    title: "Följ upp åtgärd",
    items: ["Uppdatera projektplan", "Skicka rapport"],
    count: 2,
    daysSinceMeeting: 3,
    daysUntilDeadline: 5,
    hoursUntilMeeting: 2,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/agents/meetings/${meetingId}/actions`,
  }
}

function renderTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match
  })
}

// Notification sending functions (simplified)
async function sendEmailNotification(recipients: string[], data: any) {
  console.log(`Sending email to ${recipients.join(", ")}: ${data.subject}`)
  // In production, integrate with email service (SendGrid, AWS SES, etc.)
}

async function sendTeamsNotification(recipients: string[], data: any) {
  console.log(`Sending Teams notification to ${recipients.join(", ")}: ${data.subject}`)
  // In production, integrate with Microsoft Graph API
}

async function sendSlackNotification(recipients: string[], data: any) {
  console.log(`Sending Slack notification to ${recipients.join(", ")}: ${data.subject}`)
  // In production, integrate with Slack API
}

async function sendPushNotification(recipients: string[], data: any) {
  console.log(`Sending push notification to ${recipients.join(", ")}: ${data.subject}`)
  // In production, integrate with push notification service
}
