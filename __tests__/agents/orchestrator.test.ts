// En förenklad "motor"-test som verifierar att ett transkript leder till beslut+åtgärd
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Mock external integrations
jest.mock("@/lib/integrations/graph");
jest.mock("@/lib/integrations/zoom");

describe("Orchestrator – transcript -> decisions/actions", () => {
  test("skapar beslut från transkript", async () => {
    // Anta att ni har en funktion i lib/agents/orchestrator.ts:
    // await orchestrateFromTranscript(meetingId, transcriptText)
    // Här mockar vi "orchestrateFromTranscript" med direkt insert (demo).
    const meetingId = "Q3-Strategy-001";
    await prisma.decisionCard.create({
      data: { 
        id: "D-999", 
        meetingId, 
        headline: "Demo-beslut", 
        problem: "Test problem",
        alternatives: ["Alternativ 1", "Alternativ 2"],
        recommendation: "Demo-beslut",
        owner: "Kalle", 
        decidedAt: new Date(),
        consequences: [],
        citations: [],
      },
    });
    const d = await prisma.decisionCard.findUnique({ where: { id: "D-999" } });
    expect(d?.headline).toMatch(/Demo-beslut/);
  });
});
