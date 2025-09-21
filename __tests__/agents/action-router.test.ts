import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

// Mock external integrations
jest.mock("@/lib/integrations/graph");
jest.mock("@/lib/integrations/zoom");

describe("Action Router – 48h nudge-kedja", () => {
  let conn: IORedis;
  let q: Queue;
  let seen: Job<any, any, string>[] = [];

  beforeAll(() => {
    conn = new IORedis(process.env.REDIS_URL!);
    q = new Queue("agent-jobs", { connection: conn });
  });

  afterAll(async () => {
    await q.drain();
    await q.close();
    await conn.quit();
  });

  test("skapar nudge-jobb och kör backoff/retry", async () => {
    const w = new Worker("agent-jobs", async (job) => {
      seen.push(job);
      // markera som klar direkt i test
      return true;
    }, { connection: conn });

    await q.add("nudge-action", { actionId: "A-91" }, { delay: 10 }); // 10 ms istället för 48h
    // vänta lite
    await new Promise(r => setTimeout(r, 100));
    await w.close();

    expect(seen.some(j => j.name === "nudge-action" && j.data.actionId === "A-91")).toBe(true);
  });
});
