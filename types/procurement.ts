export interface RequirementVariant {
  id: "A" | "B"
  title: string
  text: string
}

export interface ProcurementContext {
  industry?: string
  contractValue?: string
  evaluationModel?: string
  mandatoryCriteria?: string[]
  niceToHaveCriteria?: string[]
}

export interface SimulationInput {
  meetingId?: string
  variants: RequirementVariant[]
  context?: ProcurementContext
  persona?: string
}

export interface SimulationScore {
  competitiveness: number // 0-100
  smeAccessibility: number // 0-100
  complianceRisk: number // 0-100
  clarityScore: number // 0-100
}

export interface SimulationInsight {
  label: string
  description: string
  severity: "info" | "warning" | "risk"
}

export interface SimulationRecommendation {
  summary: string
  suggestedText: string
  rationale: string
  legalReference?: string
}

export interface SimulationResult {
  variantId: RequirementVariant["id"]
  scores: SimulationScore
  insights: SimulationInsight[]
}

export interface SimulationResponse {
  variants: SimulationResult[]
  winner?: RequirementVariant["id"]
  recommendation: SimulationRecommendation
}
