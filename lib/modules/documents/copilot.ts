import type { DocumentContext, CopilotSuggestion } from "@/types/documents"
import { env } from "@/lib/config"

class DocumentCopilot {
  async analyze(context: DocumentContext): Promise<CopilotSuggestion> {
    const ai = await this.fetchAI(context)
    if (ai) return ai
    return this.fallback(context)
  }

  private async fetchAI(context: DocumentContext): Promise<CopilotSuggestion | null> {
    if (!env.AI_ASSISTANT_API_URL || !env.AI_ASSISTANT_API_KEY) {
      return null
    }

    const response = await fetch(`${env.AI_ASSISTANT_API_URL}/documents/diff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AI_ASSISTANT_API_KEY}`,
      },
      body: JSON.stringify(context),
    })

    if (!response.ok) {
      console.warn("Doc copilot diff misslyckades", await response.text())
      return null
    }

    return (await response.json()) as CopilotSuggestion
  }

  private fallback(context: DocumentContext): CopilotSuggestion {
    const diffs = diffText(context.currentVersion, context.proposedChanges)
    return {
      summary: "Föreslagna ändringar analyserades utan AI-tjänst.",
      diff: diffs,
      recommendation:
        "Granska markerade ändringar manuellt. Säkerställ att repetitiva 'ska'-krav ersätts med funktionskrav där det är möjligt.",
      legalReferences: guessLegalReferences(context),
      confidence: 0.4,
    }
  }
}

const diffText = (original: string, updated: string) => {
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
      diff.push({ type: "removed", original: o, severity: scoreSeverity(o) })
    } else if (!o && u) {
      diff.push({ type: "added", updated: u, rationale: generateRationale(u), severity: scoreSeverity(u) })
    } else if (o && u && o !== u) {
      diff.push({
        type: "modified",
        original: o,
        updated: u,
        rationale: generateRationale(u),
        severity: scoreSeverity(u),
      })
    }
  }

  return diff
}

const scoreSeverity = (line?: string) => {
  if (!line) return "low"
  const lower = line.toLowerCase()
  if (lower.includes("ansvar") || lower.includes("garanti")) return "high"
  if (lower.includes("leverans") || lower.includes("tid")) return "medium"
  return "low"
}

const generateRationale = (line?: string) => {
  if (!line) return undefined
  if (line.toLowerCase().includes("ska")) {
    return "Överväg att använda funktionskrav i stället för ska-krav för att undvika överimplementering."
  }
  if (line.toLowerCase().includes("inom 2 dagar")) {
    return "Tidsfrister kan vara oproportionerliga. Justera för att öka konkurrens."
  }
  return "Ta ställning till om formuleringen behöver förtydligas eller kompletteras."
}

const guessLegalReferences = (context: DocumentContext) => {
  const refs: string[] = []
  const text = `${context.currentVersion}\n${context.proposedChanges}`.toLowerCase()

  if (text.includes("personuppgift")) refs.push("GDPR Art. 32")
  if (text.includes("upphandling")) refs.push("LOU 19 kap. 3 §")
  if (context.documentType === "contract") refs.push("Avtalslagen 1915:218")

  return refs
}

export const documentCopilot = new DocumentCopilot()
