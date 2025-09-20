import type { ComponentType } from "react"

import { LayoutDashboard, Briefcase, Users, ClipboardList, ShieldCheck, Sparkles } from "lucide-react"

export interface AgentNavItem {
  title: string
  description: string
  href: string
  icon: ComponentType<{ className?: string }>
}

export const agentNavItems: AgentNavItem[] = [
  {
    title: "Översikt",
    description: "Status för möten, beslut och åtgärder.",
    href: "/agents",
    icon: LayoutDashboard,
  },
  {
    title: "Briefs",
    description: "Pre- och post-briefer från Briefing Engine.",
    href: "/agents/briefs",
    icon: Briefcase,
  },
  {
    title: "Decision cards",
    description: "Aktuella beslutsunderlag och rekommendationer.",
    href: "/agents/decision-cards",
    icon: ClipboardList,
  },
  {
    title: "Stakeholders",
    description: "Kartan över intressenter och påverkan.",
    href: "/agents/stakeholders",
    icon: Users,
  },
  {
    title: "Regwatch",
    description: "Senaste ändringar i regelverk och policy.",
    href: "/agents/regwatch",
    icon: ShieldCheck,
  },
  {
    title: "Moduler",
    description: "Aktivera agentprofiler och integrationsmoduler.",
    href: "/agents/modules",
    icon: Sparkles,
  },
]
