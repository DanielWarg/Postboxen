import type {
  SimulationInput,
  SimulationResponse,
  SimulationResult,
  SimulationRecommendation,
} from "@/types/procurement"
import { getEventBus } from "@/lib/agents/events"

const AI_API = process.env.AI_ASSISTANT_API_URL
const AI_API_KEY = process.env.AI_ASSISTANT_API_KEY

export class ProcurementSimulator {
  async run(input: SimulationInput): Promise<SimulationResponse> {
    const payload = await this.fetchAI(input)

    const response: SimulationResponse = {
      variants: payload.variants,
      winner: payload.winner,
      recommendation: payload.recommendation,
    }

    const bus = getEventBus()
    await bus.publish({
      type: "procurement.simulation",
      meetingId: input.meetingId ?? "",
      occurredAt: new Date().toISOString(),
      payload: response,
    })

    return response
  }

  private async fetchAI(input: SimulationInput) {
    if (!AI_API || !AI_API_KEY) {
      return this.fallback(input)
    }

    const response = await fetch(`${AI_API}/procurement/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      console.warn("Procurement simulate request failed", await response.text())
      return this.fallback(input)
    }

    const data = (await response.json()) as SimulationResponse
    return data
  }

  private fallback(input: SimulationInput): SimulationResponse {
    const variants: SimulationResult[] = input.variants.map((variant) => {
      const lengthPenalty = Math.min(20, Math.max(0, variant.text.length - 800) / 20)
      const smeAccessibility = Math.max(30, 90 - lengthPenalty)
      const competitiveness = Math.max(40, 95 - lengthPenalty / 2)
      const complianceRisk = variant.text.toLowerCase().includes("ska") ? 55 : 35
      const clarityScore = 80 - lengthPenalty / 3

      return {
        variantId: variant.id,
        scores: {
          competitiveness,
          smeAccessibility,
          complianceRisk,
          clarityScore,
        },
        insights: buildFallbackInsights(variant),
      }
    })

    const best = variants.reduce((acc, current) =>
      current.scores.smeAccessibility + current.scores.competitiveness <
      acc.scores.smeAccessibility + acc.scores.competitiveness
        ? acc
        : current,
    variants[0])

    const recommendation: SimulationRecommendation = {
      summary: "Förenkla kravet för att öka konkurrensen och SME-deltagande.",
      suggestedText: simplifyText(input.variants.find((variant) => variant.id === best.variantId)?.text ?? ""),
      rationale:
        "Nuvarande formulering kan uppfattas som överimplementering. Rekommenderad text är proportionell och refererar till funktionskrav i stället för detaljerade teknikval.",
      legalReference: "LOU 19 kap. 3 §",
    }

    return {
      variants,
      winner: best.variantId,
      recommendation,
    }
  }
}

const simplifyText = (text: string) => {
  if (!text) return "Leverantören ska beskriva hur kravet uppfylls och uppvisa relevant erfarenhet."
  return text
    .replace(/ska/gi, "bör")
    .replace(/måste/gi, "bör")
    .slice(0, 400)
    .concat("…")
}

const buildFallbackInsights = (variant: { text: string }) => {
  const lower = variant.text.toLowerCase()
  const insights: SimulationResult["insights"] = []

  if (lower.includes("certifier")) {
    insights.push({
      label: "Certifieringskrav",
      description: "Certifikat kan stänga ute SME – överväg att acceptera likvärdiga bevis.",
      severity: "warning",
    })
  }

  if (variant.text.length > 900) {
    insights.push({
      label: "Lång text",
      description: "Kravet är långt och detaljerat, vilket kan ge tolkningar och öka risken för överimplementering.",
      severity: "info",
    })
  }

  if (!lower.includes("ska")) {
    insights.push({
      label: "Flexibel formulering",
      description: "Formuleringen verkar fokusera på funktionskrav – positivt för konkurrensen.",
      severity: "info",
    })
  }

  return insights
}

export const procurementSimulator = new ProcurementSimulator()
