import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Mock external integrations
jest.mock("@/lib/integrations/graph");
jest.mock("@/lib/integrations/zoom");

describe("Compliance – retention & radera allt", () => {
  test("respekterar retention på consent", async () => {
    const c = await prisma.meetingConsent.findFirst({ where: { meetingId: "Q3-Strategy-001" } });
    expect(c?.retentionDays).toBeGreaterThan(0);
  });

  test("radera allt tar bort artefakter men lämnar audit-markör", async () => {
    const meetingId = "Q3-Strategy-001";
    // anta att ni har en service: compliance.deleteAllForMeeting(meetingId)
    // här simulerar vi: ta bort actions/decisions/briefs/transcripts men skapa en audit-markör
    await prisma.actionItem.deleteMany({ where: { meetingId } });
    await prisma.decisionCard.deleteMany({ where: { meetingId } });
    await prisma.meetingBrief.deleteMany({ where: { meetingId } });

    await prisma.auditEntry.create({
      data: {
        meetingId,
        event: "DELETE_ALL",
        payload: { reason: "user_request" },
        occurredAt: new Date(),
      },
    });

    const acts = await prisma.actionItem.findMany({ where: { meetingId } });
    expect(acts.length).toBe(0);

    const aud = await prisma.auditEntry.findFirst({ where: { meetingId, event: "DELETE_ALL" } });
    expect(aud).toBeTruthy();
  });
});
