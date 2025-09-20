import { addRetentionJob } from "@/lib/queues"
import prisma from "@/lib/db"
import { getRedisClient } from "@/lib/redis/client"
import { ApiError } from "@/lib/http/errors"

export interface RetentionConfig {
  profile: "bas" | "plus" | "juridik"
  retentionDays: number
  dataResidency: "eu" | "customer" | "global"
}

export interface RetentionResult {
  meetingId: string
  deletedRecords: {
    meetings: number
    decisions: number
    actionItems: number
    briefs: number
    stakeholders: number
    summaries: number
    consent: number
    auditEntries: number
  }
  auditHash: string
  consentReceipt: string
}

const RETENTION_PROFILES: Record<string, RetentionConfig> = {
  bas: {
    profile: "bas",
    retentionDays: 30,
    dataResidency: "eu",
  },
  plus: {
    profile: "plus", 
    retentionDays: 90,
    dataResidency: "eu",
  },
  juridik: {
    profile: "juridik",
    retentionDays: 365,
    dataResidency: "customer",
  },
}

export async function scheduleRetentionJob(meetingId: string, profile: string) {
  const config = RETENTION_PROFILES[profile]
  if (!config) {
    throw new ApiError(`Okänd samtyckesprofil: ${profile}`, 400)
  }

  // Schemalägg retention-jobb för framtiden
  const retentionDate = new Date()
  retentionDate.setDate(retentionDate.getDate() + config.retentionDays)

  await addRetentionJob(meetingId, retentionDate, config)
  
  return {
    meetingId,
    retentionDate: retentionDate.toISOString(),
    profile: config.profile,
    retentionDays: config.retentionDays,
  }
}

export async function executeRetentionJob(meetingId: string, config: RetentionConfig): Promise<RetentionResult> {
  const redis = getRedisClient()
  
  try {
    // Hämta mötet och alla relaterade data
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        summary: true,
        decisions: true,
        actionItems: true,
        briefs: true,
        stakeholders: true,
        consent: true,
        auditEntries: true,
      },
    })

    if (!meeting) {
      throw new ApiError(`Möte ${meetingId} hittades inte`, 404)
    }

    // Skapa audit-hash för spårbarhet
    const auditData = {
      meetingId,
      deletedAt: new Date().toISOString(),
      profile: config.profile,
      retentionDays: config.retentionDays,
      dataResidency: config.dataResidency,
      organizerEmail: meeting.organizerEmail,
      title: meeting.title,
    }
    
    const auditHash = await createAuditHash(auditData)
    
    // Generera consent receipt
    const consentReceipt = await generateConsentReceipt(meeting, config, auditHash)

    // Räkna poster innan borttagning
    const deletedRecords = {
      meetings: 1,
      decisions: meeting.decisions.length,
      actionItems: meeting.actionItems.length,
      briefs: meeting.briefs.length,
      stakeholders: meeting.stakeholders.length,
      summaries: meeting.summary ? 1 : 0,
      consent: meeting.consent ? 1 : 0,
      auditEntries: meeting.auditEntries.length,
    }

    // Utför borttagning i transaktion
    await prisma.$transaction(async (tx) => {
      // Ta bort alla relaterade poster
      await tx.auditEntry.deleteMany({ where: { meetingId } })
      await tx.decisionCard.deleteMany({ where: { meetingId } })
      await tx.actionItem.deleteMany({ where: { meetingId } })
      await tx.meetingBrief.deleteMany({ where: { meetingId } })
      await tx.stakeholder.deleteMany({ where: { meetingId } })
      await tx.meetingSummary.deleteMany({ where: { meetingId } })
      await tx.meetingConsent.deleteMany({ where: { meetingId } })
      
      // Ta bort själva mötet
      await tx.meeting.delete({ where: { id: meetingId } })
    })

    // Logga audit-entry
    await logRetentionAudit(auditData, deletedRecords, auditHash)

    // Cache invalidering
    if (redis) {
      await redis.del(`meeting:${meetingId}`)
      await redis.del(`meeting:overview`)
    }

    return {
      meetingId,
      deletedRecords,
      auditHash,
      consentReceipt,
    }

  } catch (error) {
    console.error(`Retention job failed for meeting ${meetingId}:`, error)
    throw error
  }
}

export async function deleteAllDataForUser(userEmail: string): Promise<{
  deletedMeetings: number
  auditHash: string
  consentReceipt: string
}> {
  const redis = getRedisClient()
  
  try {
    // Hämta alla möten för användaren
    const meetings = await prisma.meeting.findMany({
      where: { organizerEmail: userEmail },
      include: {
        summary: true,
        decisions: true,
        actionItems: true,
        briefs: true,
        stakeholders: true,
        consent: true,
        auditEntries: true,
      },
    })

    if (meetings.length === 0) {
      return {
        deletedMeetings: 0,
        auditHash: "",
        consentReceipt: "",
      }
    }

    // Skapa audit-hash
    const auditData = {
      userEmail,
      deletedAt: new Date().toISOString(),
      deletedMeetings: meetings.length,
      action: "delete_all",
    }
    
    const auditHash = await createAuditHash(auditData)
    
    // Generera consent receipt
    const consentReceipt = await generateUserConsentReceipt(userEmail, meetings, auditHash)

    // Räkna totala poster
    const totalRecords = meetings.reduce((sum, meeting) => {
      return sum + 1 + // meeting
        meeting.decisions.length +
        meeting.actionItems.length +
        meeting.briefs.length +
        meeting.stakeholders.length +
        (meeting.summary ? 1 : 0) +
        (meeting.consent ? 1 : 0) +
        meeting.auditEntries.length
    }, 0)

    // Utför borttagning i transaktion
    await prisma.$transaction(async (tx) => {
      const meetingIds = meetings.map(m => m.id)
      
      // Ta bort alla relaterade poster
      await tx.auditEntry.deleteMany({ where: { meetingId: { in: meetingIds } } })
      await tx.decisionCard.deleteMany({ where: { meetingId: { in: meetingIds } } })
      await tx.actionItem.deleteMany({ where: { meetingId: { in: meetingIds } } })
      await tx.meetingBrief.deleteMany({ where: { meetingId: { in: meetingIds } } })
      await tx.stakeholder.deleteMany({ where: { meetingId: { in: meetingIds } } })
      await tx.meetingSummary.deleteMany({ where: { meetingId: { in: meetingIds } } })
      await tx.meetingConsent.deleteMany({ where: { meetingId: { in: meetingIds } } })
      
      // Ta bort alla möten
      await tx.meeting.deleteMany({ where: { organizerEmail: userEmail } })
    })

    // Logga audit-entry
    await logUserDeletionAudit(auditData, totalRecords, auditHash)

    // Cache invalidering
    if (redis) {
      const keys = meetings.map(m => `meeting:${m.id}`)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
      await redis.del(`meeting:overview`)
    }

    return {
      deletedMeetings: meetings.length,
      auditHash,
      consentReceipt,
    }

  } catch (error) {
    console.error(`Delete all data failed for user ${userEmail}:`, error)
    throw error
  }
}

async function createAuditHash(data: any): Promise<string> {
  const crypto = await import('crypto')
  const hash = crypto.createHash('sha256')
  hash.update(JSON.stringify(data))
  return hash.digest('hex')
}

async function generateConsentReceipt(meeting: any, config: RetentionConfig, auditHash: string): Promise<string> {
  return JSON.stringify({
    type: "consent_receipt",
    meetingId: meeting.id,
    organizerEmail: meeting.organizerEmail,
    profile: config.profile,
    retentionDays: config.retentionDays,
    dataResidency: config.dataResidency,
    deletedAt: new Date().toISOString(),
    auditHash,
    signature: await createAuditHash({ meetingId: meeting.id, auditHash }),
  }, null, 2)
}

async function generateUserConsentReceipt(userEmail: string, meetings: any[], auditHash: string): Promise<string> {
  return JSON.stringify({
    type: "user_consent_receipt",
    userEmail,
    deletedMeetings: meetings.length,
    deletedAt: new Date().toISOString(),
    auditHash,
    signature: await createAuditHash({ userEmail, auditHash }),
  }, null, 2)
}

async function logRetentionAudit(auditData: any, deletedRecords: any, auditHash: string) {
  // Logga till audit-tabellen (om den finns)
  try {
    await prisma.auditEntry.create({
      data: {
        meetingId: auditData.meetingId,
        event: "retention_deletion",
        payload: {
          ...auditData,
          deletedRecords,
          auditHash,
        },
        policy: "retention_policy",
        occurredAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Failed to log retention audit:", error)
  }
}

async function logUserDeletionAudit(auditData: any, totalRecords: number, auditHash: string) {
  // Logga till audit-tabellen (om den finns)
  try {
    await prisma.auditEntry.create({
      data: {
        meetingId: `user_deletion_${auditData.userEmail}`,
        event: "user_data_deletion",
        payload: {
          ...auditData,
          totalRecords,
          auditHash,
        },
        policy: "user_deletion_policy",
        occurredAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Failed to log user deletion audit:", error)
  }
}
