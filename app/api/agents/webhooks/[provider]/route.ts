import { NextRequest, NextResponse } from "next/server"
import { Buffer } from "node:buffer"
import { createHmac, timingSafeEqual } from "node:crypto"
import { z } from "zod"

import { configForPlatform } from "@/lib/agents/config"
import { ensureAgentBootstrap } from "@/lib/agents/bootstrap"
import { resolveProvider } from "@/lib/integrations/providers"
import { assertEnv } from "@/lib/integrations/providers/base"
import type { MeetingPlatform, ProviderWebhookPayload } from "@/types/meetings"

const providerSchema = z.enum(["microsoft-teams", "zoom", "google-meet", "webex"] as [MeetingPlatform, ...MeetingPlatform[]])

const verifyWebexSignature = (request: NextRequest, body: string) => {
  const secret = process.env.WEBEX_WEBHOOK_SECRET
  const signature = request.headers.get("x-spark-signature")
  if (!secret || !signature) return true

  const digest = createHmac("sha1", secret).update(body).digest("hex")
  const digestBuffer = Buffer.from(digest, "hex")
  const signatureBuffer = Buffer.from(signature, "hex")

  if (digestBuffer.length !== signatureBuffer.length) return false
  return timingSafeEqual(digestBuffer, signatureBuffer)
}

export async function POST(request: NextRequest, { params }: { params: { provider: string } }) {
  const bodyText = await request.text()

  try {
    const platform = providerSchema.parse(params.provider)

    if (platform === "zoom") {
      const parsed = JSON.parse(bodyText) as any
      if (parsed.event === "endpoint.url_validation") {
        const plainToken: string = parsed.payload?.plainToken
        const secretToken = assertEnv("ZOOM_WEBHOOK_SECRET_TOKEN")
        const encryptedToken = createHmac("sha256", secretToken).update(plainToken).digest("base64")
        return NextResponse.json({ plainToken, encryptedToken })
      }
    }

    if (platform === "webex" && !verifyWebexSignature(request, bodyText)) {
      return NextResponse.json({ error: "Ogiltig Webex-signatur" }, { status: 403 })
    }

    ensureAgentBootstrap()

    const payload = JSON.parse(bodyText) as ProviderWebhookPayload

    const config = configForPlatform(platform)
    const provider = resolveProvider(config)

    await provider.handleWebhook(config, payload)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook-fel", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 })
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
