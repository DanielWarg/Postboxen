import { PrismaClient } from "@prisma/client";
import { addDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const m1 = await prisma.meeting.create({
    data: {
      id: "Q3-Strategy-001",
      title: "Q3-strategi",
      startTime: now,
      endTime: addDays(now, 0),
      joinUrl: "https://teams.microsoft.com/l/meetup-join/test",
      organizerEmail: "organizer@example.com",
      attendees: ["attendee1@example.com", "attendee2@example.com"],
      consentProfile: "BAS",
    },
  });
  const m2 = await prisma.meeting.create({
    data: {
      id: "Anbud-UL-042",
      title: "Anbud UL",
      startTime: addDays(now, 1),
      endTime: addDays(now, 1),
      joinUrl: "https://zoom.us/j/test",
      organizerEmail: "organizer2@example.com",
      attendees: ["attendee3@example.com"],
      consentProfile: "BAS",
    },
  });

  await prisma.meetingBrief.create({
    data: {
      meetingId: m1.id,
      type: "PRE",
      generatedAt: now,
      subject: "Q3-strategi",
      headline: "Förberedelser för strategimöte",
      keyPoints: ["Status", "Leveransplan", "Risker"],
      risks: ["Leverantörspris"],
      content: "Detta är en för-brief för strategimötet.",
      delivery: { method: "email", sent: false },
    },
  });

  await prisma.decisionCard.create({
    data: {
      id: "D-101",
      meetingId: m1.id,
      headline: "Lansera pilot 15 okt",
      problem: "Behöver testa ny funktionalitet",
      alternatives: ["Pilot", "Full rollout", "Ingen förändring"],
      recommendation: "Lansera pilot 15 okt",
      owner: "Anna",
      decidedAt: new Date("2025-10-15"),
      consequences: ["Risk för förseningar", "Möjlighet att lära"],
      citations: [],
    },
  });
  
  await prisma.actionItem.create({
    data: {
      id: "A-91",
      meetingId: m1.id,
      title: "Skapa Planner board",
      description: "Skapa en Planner board för projektuppföljning",
      owner: "Anna",
      dueDate: new Date("2025-10-20"),
      source: "transcript",
      status: "OPEN",
      externalLinks: [],
    },
  });

  await prisma.regulationSource.create({
    data: {
      id: "RW-1",
      title: "AI Act – artikel 10 uppdaterad",
      jurisdiction: "EU",
      url: "https://eur-lex.europa.eu/ai-act",
      version: "1.1",
      publishedAt: new Date("2026-06-01"),
    },
  });

  await prisma.stakeholder.create({
    data: {
      meetingId: m1.id,
      email: "lisa@example.com",
      name: "Lisa",
      interests: ["risk management"],
      concerns: ["budget"],
      influence: "high",
      notes: "Viktig beslutsfattare",
    },
  });

  await prisma.meetingConsent.create({
    data: {
      meetingId: m1.id,
      profile: "BAS",
      scope: ["audio", "chat"],
      retentionDays: 90,
      dataResidency: "EU",
      acceptedAt: now,
    },
  });
}

main().finally(async () => prisma.$disconnect());
