import type { Citation, MeetingTranscriptSegment } from "@/types/meetings"

interface RagSource {
  id: string
  law: string
  article: string
  version: string
  url: string
  snippet: string
  publishedAt: string
}

const sources: RagSource[] = [
  {
    id: "gdpr-32",
    law: "GDPR",
    article: "Art. 32",
    version: "(EU) 2016/679",
    url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    snippet: "Säkerhet vid behandling av personuppgifter",
    publishedAt: "2016-04-27",
  },
  {
    id: "ai-act-9",
    law: "AI Act",
    article: "Art. 9",
    version: "EU 2024",
    url: "https://eur-lex.europa.eu/legal-content/SV/TXT/?uri=CELEX%3A52021PC0206",
    snippet: "Riskhanteringssystem för AI",
    publishedAt: "2024-03-13",
  },
  {
    id: "lou-19",
    law: "LOU",
    article: "19 kap. 3 §",
    version: "2023:966",
    url: "https://lagen.nu/2016:1145",
    snippet: "Proportionalitet i tekniska krav",
    publishedAt: "2023-07-01",
  },
]

export interface CitationInput {
  meetingId: string
  persona?: string
  segments: MeetingTranscriptSegment[]
}

export const buildCitations = ({ segments }: CitationInput): Citation[] => {
  const lowered = segments.map((segment) => segment.text.toLowerCase()).join(" ")
  const matches: Citation[] = []

  if (lowered.includes("personuppgift") || lowered.includes("gdpr")) {
    matches.push(toCitation(sources.find((item) => item.id === "gdpr-32")!))
  }
  if (lowered.includes("ai-förordningen") || lowered.includes("ai-act")) {
    matches.push(toCitation(sources.find((item) => item.id === "ai-act-9")!))
  }
  if (lowered.includes("upphandling") || lowered.includes("lou")) {
    matches.push(toCitation(sources.find((item) => item.id === "lou-19")!))
  }

  return matches
}

const toCitation = (source: RagSource): Citation => ({
  label: `${source.law} ${source.article}`,
  description: source.snippet,
  url: source.url,
  law: source.law,
  article: source.article,
  version: source.version,
  publishedAt: source.publishedAt,
})
