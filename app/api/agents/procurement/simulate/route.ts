import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { ensureAgentBootstrap } from "@/lib/agents/bootstrap"
import { procurementSimulator } from "@/lib/modules/procurement/simulator"

const variantSchema = z.object({
  id: z.union([z.literal("A"), z.literal("B")]),
  title: z.string().min(1),
  text: z.string().min(50),
})

const contextSchema = z.object({
  industry: z.string().optional(),
  contractValue: z.string().optional(),
  evaluationModel: z.string().optional(),
  mandatoryCriteria: z.array(z.string()).optional(),
  niceToHaveCriteria: z.array(z.string()).optional(),
})

const bodySchema = z.object({
  meetingId: z.string().optional(),
  persona: z.string().optional(),
  context: contextSchema.optional(),
  variants: z
    .array(variantSchema)
    .min(2)
    .max(2)
    .refine((variants) => new Set(variants.map((variant) => variant.id)).size === variants.length, {
      message: "Varianterna måste ha unika ID:n (A och B)",
    }),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parse = bodySchema.safeParse(json)
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
    }

    ensureAgentBootstrap()

    const result = await procurementSimulator.run(parse.data)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Kravsimulatorn misslyckades", error)
    return NextResponse.json(
      {
        error: "Det gick inte att simulera kraven just nu.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
