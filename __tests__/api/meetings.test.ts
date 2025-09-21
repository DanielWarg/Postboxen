import { NextRequest } from "next/server";
import * as meetingsRoute from "@/app/api/agents/meetings/route";
import * as meetingRoute from "@/app/api/agents/meetings/[meetingId]/route";

// Mock external integrations
jest.mock("@/lib/integrations/graph");
jest.mock("@/lib/integrations/zoom");

describe("API – meetings", () => {
  test("GET /api/agents/meetings listar möten", async () => {
    // Kallar direkt på handlern (utan att spinna upp en HTTP-server)
    const res = await (meetingsRoute.GET as any)(new NextRequest("http://test/"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.meetings)).toBe(true);
    expect(json.meetings.find((m: any) => m.id === "Q3-Strategy-001")).toBeTruthy();
  });

  test("GET /api/agents/meetings/[meetingId] returnerar meeting+audit", async () => {
    const res = await (meetingRoute.GET as any)(
      new NextRequest("http://test/"),
      { params: { meetingId: "Q3-Strategy-001" } }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.meeting.id).toBe("Q3-Strategy-001");
    // audit kan vara tom i seed, men endpointen ska returnera nyckeln
    expect(json).toHaveProperty("audit");
  });

  test("GET /api/agents/meetings/[meetingId] -> 404 för okänt möte", async () => {
    const res = await (meetingRoute.GET as any)(
      new NextRequest("http://test/"),
      { params: { meetingId: "UNKNOWN" } }
    );
    expect(res.status).toBe(404);
  });
});
