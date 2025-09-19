import { registerDecisionSubscribers } from "@/lib/agents/decision-cards"
import { registerActionRouter } from "@/lib/agents/action-router"
import { registerAuditListeners } from "@/lib/agents/compliance"
import { registerBriefingListeners } from "@/lib/agents/briefing"

let bootstrapped = false

export const ensureAgentBootstrap = () => {
  if (bootstrapped) return
  registerDecisionSubscribers()
  registerActionRouter()
  registerAuditListeners()
  registerBriefingListeners()
  bootstrapped = true
}
