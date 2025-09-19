export interface DocumentContext {
  meetingId: string
  title: string
  currentVersion: string
  proposedChanges: string
  persona?: string
  documentType?: "contract" | "procurement" | "policy" | "other"
  references?: string[]
}

export interface DiffSegment {
  type: "added" | "removed" | "modified" | "unchanged"
  original?: string
  updated?: string
  rationale?: string
  severity?: "high" | "medium" | "low"
  citations?: Array<{
    label: string
    url?: string
    law?: string
    article?: string
  }>
}

export interface CopilotSuggestion {
  summary: string
  diff: DiffSegment[]
  recommendation: string
  legalReferences?: string[]
  confidence?: number
}
