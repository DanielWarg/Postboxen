import { prisma } from "@/lib/db/client"

export const auditRepository = {
  async record(entry: {
    meetingId?: string
    event: string
    payload: unknown
    policy?: string
    occurredAt: Date
  }) {
    await prisma.auditEntry.create({
      data: {
        meetingId: entry.meetingId ?? null,
        event: entry.event,
        payload: entry.payload,
        policy: entry.policy,
        occurredAt: entry.occurredAt,
      },
    })
  },

  async listForMeeting(meetingId: string) {
    return prisma.auditEntry.findMany({
      where: { meetingId },
      orderBy: { occurredAt: "asc" },
    })
  },
}
