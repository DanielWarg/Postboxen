import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST() {
  if (process.env.NODE_ENV !== "test" && process.env.E2E_BYPASS_AUTH !== "1")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await prisma.$transaction([
    prisma.actionItem.deleteMany({}),
    prisma.decisionCard.deleteMany({}),
    prisma.meetingBrief.deleteMany({}),
    prisma.meetingConsent.deleteMany({}),
    prisma.stakeholder.deleteMany({}),
    prisma.regulationSource.deleteMany({}),
    prisma.meeting.deleteMany({}),
  ]);

  // Återseeda om du vill:
  // await seed();

  return NextResponse.json({ ok: true });
}
