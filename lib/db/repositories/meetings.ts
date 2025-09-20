import { prisma } from "@/lib/db"
import type { MeetingMetadata } from "@/types/meetings"

export const meetingRepository = {
  async createMeeting(metadata: MeetingMetadata) {
    return await prisma.meeting.create({
      data: {
        id: metadata.meetingId,
        title: metadata.title,
        startTime: metadata.startTime,
        endTime: metadata.endTime,
        joinUrl: metadata.joinUrl,
        organizerEmail: metadata.organizerEmail,
        attendees: metadata.attendees,
        agenda: metadata.agenda,
        persona: metadata.persona,
        language: metadata.language,
        consentProfile: metadata.consentProfile,
      }
    })
  },

  async getMeetingById(meetingId: string) {
    return await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        summary: true,
        decisions: true,
        actionItems: true,
        briefs: true,
        stakeholders: true,
        consent: true,
        auditEntries: true,
      }
    })
  },

  async getMeetingOverview() {
    return await prisma.meeting.findMany({
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        organizerEmail: true,
        createdAt: true,
        decisions: { select: { id: true } },
        actionItems: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  async updateMeeting(meetingId: string, data: Partial<MeetingMetadata>) {
    return await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        joinUrl: data.joinUrl,
        organizerEmail: data.organizerEmail,
        attendees: data.attendees,
        agenda: data.agenda,
        persona: data.persona,
        language: data.language,
        consentProfile: data.consentProfile,
      }
    })
  },

  async deleteMeeting(meetingId: string) {
    return await prisma.meeting.delete({
      where: { id: meetingId }
    })
  }
}