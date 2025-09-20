import { registerDecisionSubscribers } from "@/lib/agents/decision-cards"
import { registerActionRouter } from "@/lib/agents/action-router"
import { registerAuditListeners } from "@/lib/agents/compliance"
import { registerBriefingListeners } from "@/lib/agents/briefing"
import { startWorkers } from "@/lib/queues"

let bootstrapped = false

export const ensureAgentBootstrap = () => {
  if (bootstrapped) return
  registerDecisionSubscribers()
  registerActionRouter()
  registerAuditListeners()
  registerBriefingListeners()
  
  // Start job workers
  startWorkers()
  
  bootstrapped = true
}
