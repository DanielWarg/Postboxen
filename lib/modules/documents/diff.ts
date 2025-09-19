import type { CopilotSuggestion } from "@/types/documents" 

export interface TextDiffInput {
  original: string
  updated: string
}

export const naiveDiff = ({ original, updated }: TextDiffInput): CopilotSuggestion["diff"] => {
  const originalLines = original.split(/\r?\n/)
  const updatedLines = updated.split(/\r?\n/)
  const diff: CopilotSuggestion["diff"] = []

  const max = Math.max(originalLines.length, updatedLines.length)
  for (let i = 0; i < max; i++) {
    const o = originalLines[i]
    const u = updatedLines[i]
    if (o === u) {
      diff.push({ type: "unchanged", original: o })
    } else if (o && !u) {
      diff.push({ type: "removed", original: o })
    } else if (!o && u) {
      diff.push({ type: "added", updated: u })
    } else if (o && u && o !== u) {
      diff.push({ type: "modified", original: o, updated: u })
    }
  }
  return diff
}
