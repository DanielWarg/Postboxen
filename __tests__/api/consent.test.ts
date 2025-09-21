import { NextRequest } from "next/server";
import * as scheduleRoute from "@/app/api/agents/schedule/route";

// Mock external integrations
jest.mock("@/lib/integrations/graph");
jest.mock("@/lib/integrations/zoom");

describe("API – consent receipts", () => {
  test("schemaläggning returnerar consent receipt", async () => {
    const payload = {
      meetingId: "Q3-Strategy-001",
      consentProfile: "BAS",
    };
    const req = new NextRequest("http://test/", { method: "POST", body: JSON.stringify(payload) });
    const res = await (scheduleRoute.POST as any)(req);
    expect([200, 201]).toContain(res.status);
    const json = await res.json();
    expect(json).toHaveProperty("consentReceipt");
  });
});
