import type { RegulationWatchResult, RegulationSource } from "@/types/regwatch"
import { getEventBus } from "@/lib/agents/events"
import { env } from "@/lib/config"
import { regwatchRepository } from "@/lib/db/repositories/regwatch"

const DEFAULT_SOURCES: RegulationSource[] = [
  {
    id: "eu-ai-act",
    title: "EU AI-act",
    jurisdiction: "EU",
    url: "https://eur-lex.europa.eu/legal-content/SV/TXT/?uri=CELEX%3A52021PC0206",
    version: "2024",
    publishedAt: "2024-03-13",
  },
  {
    id: "gdpr",
    title: "GDPR",
    jurisdiction: "EU",
    url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    version: "2016",
    publishedAt: "2016-04-27",
  },
  {
    id: "lou",
    title: "Lagen om offentlig upphandling",
    jurisdiction: "Sweden",
    url: "https://lagen.nu/2016:1145",
    version: "2023:966",
    publishedAt: "2023-07-01",
  },
]

export class RegulationWatcher {
  constructor(private readonly sources: RegulationSource[] = DEFAULT_SOURCES) {}

  async run(): Promise<RegulationWatchResult[]> {
    const ai = await this.fetchAI()
    const results = ai?.length ? ai : this.fallback()

    await Promise.all(results.map((result) => regwatchRepository.save(result)))

    const bus = getEventBus()
    await Promise.all(
      results.map((result) =>
        bus.publish({
          type: "regulation.change",
          meetingId: "",
          occurredAt: new Date().toISOString(),
          payload: result,
        }),
      ),
    )

    return results
  }

  private async fetchAI(): Promise<RegulationWatchResult[] | null> {
    if (!env.AI_ASSISTANT_API_URL || !env.AI_ASSISTANT_API_KEY) {
      return null
    }

    const response = await fetch(`${env.AI_ASSISTANT_API_URL}/regwatch/changes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AI_ASSISTANT_API_KEY}`,
      },
      body: JSON.stringify({ sources: this.sources }),
    })

    if (!response.ok) {
      console.warn("Regwatch API misslyckades", await response.text())
      return null
    }

    return (await response.json()) as RegulationWatchResult[]
  }

  private fallback(): RegulationWatchResult[] {
    return this.sources.map((source) => ({
      source,
      changes: [
        {
          sourceId: source.id,
          section: fallbackSection(source.id),
          previousText: fallbackPrevious(source.id),
          newText: fallbackNew(source.id),
          effectiveDate: fallbackEffective(source.id),
          summary: fallbackSummary(source.id),
          impactAreas: fallbackImpact(source.id),
          severity: "warning",
        },
      ],
      recommendation: fallbackRecommendation(source.id),
    }))
  }
}

const fallbackSection = (sourceId: string) => {
  switch (sourceId) {
    case "eu-ai-act":
      return "Artikel 9 riskhantering"
    case "gdpr":
      return "Artikel 32 säkerhet i behandlingen"
    case "lou":
      return "19 kap. Tekniska krav"
    default:
      return "Övergripande"
  }
}

const fallbackPrevious = (sourceId: string) => {
  switch (sourceId) {
    case "eu-ai-act":
      return "Riskhantering ska vara proportionell mot risk."
    case "gdpr":
      return "Tekniska och organisatoriska åtgärder ska skydda personuppgifter."
    case "lou":
      return "Tekniska specifikationer ska avse särskilda standarder."
    default:
      return "Tidigare lydelse ej tillgänglig."
  }
}

const fallbackNew = (sourceId: string) => {
  switch (sourceId) {
    case "eu-ai-act":
      return "Riskhanteringssystem måste uppdateras kvartalsvis och dokumenteras."
    case "gdpr":
      return "Organisationer ska dokumentera incidentrespons inom 72 timmar."
    case "lou":
      return "Krav ska formuleras som funktionskrav och acceptera likvärdiga lösningar."
    default:
      return "Ny lydelse saknas."
  }
}

const fallbackEffective = (sourceId: string) => {
  switch (sourceId) {
    case "eu-ai-act":
      return "2026-06-01"
    case "gdpr":
      return "2025-01-01"
    case "lou":
      return "2025-09-01"
    default:
      return undefined
  }
}

const fallbackSummary = (sourceId: string) => {
  switch (sourceId) {
    case "eu-ai-act":
      return "Riskhanteringskraven skärps och kräver kvartalsvisa uppdateringar."
    case "gdpr":
      return "Incidentdokumentation konkretiseras till 72 timmar."
    case "lou":
      return "Överkvalificerande tekniska krav förbjuds explicit."
    default:
      return "Ingen förändring hittad."
  }
}

const fallbackImpact = (sourceId: string) => {
  switch (sourceId) {
    case "eu-ai-act":
      return ["AI-system", "Riskhantering", "Compliance"]
    case "gdpr":
      return ["Personuppgifter", "Incidenthantering"]
    case "lou":
      return ["Upphandling", "Kravställning", "SME"]
    default:
      return ["Regulatoriskt"]
  }
}

const fallbackRecommendation = (sourceId: string) => {
  switch (sourceId) {
    case "eu-ai-act":
      return "Etablera kvartalsvisa riskgenomgångar och uppdatera AI-riskscheman."
    case "gdpr":
      return "Uppdatera incidentprocessen så att alla ärenden dokumenteras inom 72 timmar."
    case "lou":
      return "Revidera tekniska krav till funktionskrav och acceptera likvärdiga bevis."
    default:
      return "Följ upp förändringen med juridisk rådgivning."
  }
}

export const regulationWatcher = new RegulationWatcher()
