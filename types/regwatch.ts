export interface RegulationSource {
  id: string
  title: string
  jurisdiction: "EU" | "Sweden" | "Other"
  url: string
  version: string
  publishedAt: string
}

export interface RegulationChange {
  sourceId: string
  section: string
  previousText: string
  newText: string
  effectiveDate?: string
  summary: string
  impactAreas: string[]
  severity: "info" | "warning" | "critical"
}

export interface RegulationWatchResult {
  source: RegulationSource
  changes: RegulationChange[]
  recommendation: string
}
