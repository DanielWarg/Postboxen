import type { ConsentProfile, MeetingConsent } from "@/types/meetings"
import { getMemoryStore } from "@/lib/agents/memory"

export interface PolicyDecision {
  allowed: boolean
  reason?: string
  policy: string
}

export interface PolicyContext {
  meetingId: string
  consent?: MeetingConsent
  dataClass: "transcript" | "recording" | "action" | "document" | "analytics"
  operation: "store" | "export" | "process" | "delete"
  targetRegion?: "eu" | "global"
}

const PROFILES: Record<ConsentProfile, Pick<MeetingConsent, "scope" | "retentionDays" | "dataResidency">> = {
  bas: {
    scope: ["audio", "chat"],
    retentionDays: 30,
    dataResidency: "eu",
  },
  plus: {
    scope: ["audio", "chat", "documents"],
    retentionDays: 90,
    dataResidency: "eu",
  },
  juridik: {
    scope: ["audio", "chat", "documents", "screen"],
    retentionDays: 180,
    dataResidency: "customer",
  },
}

export const buildConsent = (meetingId: string, profile: ConsentProfile, acceptedAt: string): MeetingConsent => {
  const template = PROFILES[profile]
  const consent: MeetingConsent = {
    profile,
    acceptedAt,
    scope: template.scope,
    retentionDays: template.retentionDays,
    dataResidency: template.dataResidency,
  }
  const memory = getMemoryStore()
  memory.setConsent(meetingId, consent)
  return consent
}

export const evaluatePolicy = (ctx: PolicyContext): PolicyDecision => {
  const consent = ctx.consent ?? getMemoryStore().getMeeting(ctx.meetingId)?.consent
  if (!consent) {
    return {
      allowed: false,
      reason: "Samtycke saknas",
      policy: "consent.required",
    }
  }

  if (!consent.scope.includes(scopeForDataClass(ctx.dataClass))) {
    return {
      allowed: false,
      reason: `Samtycke ${consent.profile} medger inte ${ctx.dataClass}`,
      policy: "consent.scope",
    }
  }

  if (ctx.targetRegion && ctx.targetRegion !== consent.dataResidency) {
    return {
      allowed: false,
      reason: `Data måste stanna i ${consent.dataResidency}`,
      policy: "consent.residency",
    }
  }

  return {
    allowed: true,
    policy: "consent.ok",
  }
}

const scopeForDataClass = (dataClass: PolicyContext["dataClass"]): MeetingConsent["scope"][number] => {
  switch (dataClass) {
    case "transcript":
      return "audio"
    case "recording":
      return "video"
    case "document":
      return "documents"
    case "analytics":
      return "screen"
    case "action":
    default:
      return "chat"
  }
}
