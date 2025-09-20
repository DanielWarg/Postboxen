import { addRegwatchJob } from "@/lib/queues"
import { regwatchRepository } from "@/lib/db/repositories/regwatch"
import { ApiError } from "@/lib/http/errors"

export interface RegwatchSource {
  id: string
  title: string
  jurisdiction: "EU" | "Sweden" | "Other"
  url: string
  type: "rss" | "html" | "pdf"
  lastChecked?: string
  version?: string
}

export interface RegwatchChange {
  sourceId: string
  section: string
  previousText: string
  newText: string
  effectiveDate?: string
  summary: string
  impactAreas: string[]
  severity: "info" | "warning" | "critical"
}

export interface RegwatchResult {
  source: RegwatchSource
  changes: RegwatchChange[]
  recommendation: string
  checkedAt: string
}

// Källkatalog för regwatch
const REGWATCH_SOURCES: RegwatchSource[] = [
  {
    id: "eu-ai-act",
    title: "EU AI Act",
    jurisdiction: "EU",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52021PC0206",
    type: "html",
  },
  {
    id: "gdpr-guidelines",
    title: "GDPR Guidelines",
    jurisdiction: "EU", 
    url: "https://edpb.europa.eu/our-work-tools/general-guidance/gdpr-guidelines-recommendations-best-practices_en",
    type: "html",
  },
  {
    id: "lou-2023",
    title: "LOU 2023",
    jurisdiction: "Sweden",
    url: "https://www.riksdagen.se/sv/dokument-lagar/dokument/svensk-forfattningssamling/lag-2023203-om-offentlig-upphandling_sfs-2023-203",
    type: "html",
  },
  {
    id: "dataskyddsmyndigheten",
    title: "Dataskyddsmyndigheten",
    jurisdiction: "Sweden",
    url: "https://www.dataskyddsmyndigheten.se/",
    type: "html",
  },
  {
    id: "konkurrensverket",
    title: "Konkurrensverket",
    jurisdiction: "Sweden", 
    url: "https://www.konkurrensverket.se/",
    type: "html",
  },
]

export async function scheduleRegwatchJob() {
  // Schemalägg dagligt regwatch-jobb (kl 02:00)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(2, 0, 0, 0)

  await addRegwatchJob(tomorrow)
  
  return {
    scheduledFor: tomorrow.toISOString(),
    sources: REGWATCH_SOURCES.length,
  }
}

export async function executeRegwatchJob(): Promise<RegwatchResult[]> {
  const results: RegwatchResult[] = []
  
  try {
    console.log("Starting regwatch job...")
    
    for (const source of REGWATCH_SOURCES) {
      try {
        console.log(`Checking source: ${source.title}`)
        
        const result = await checkSource(source)
        if (result.changes.length > 0) {
          results.push(result)
          
          // Spara till databas
          await regwatchRepository.save(result)
          
          console.log(`Found ${result.changes.length} changes in ${source.title}`)
        } else {
          console.log(`No changes found in ${source.title}`)
        }
        
        // Vänta lite mellan källor för att inte överbelasta
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`Failed to check source ${source.title}:`, error)
        // Fortsätt med nästa källa även om en misslyckas
      }
    }
    
    console.log(`Regwatch job completed. Found changes in ${results.length} sources.`)
    return results
    
  } catch (error) {
    console.error("Regwatch job failed:", error)
    throw error
  }
}

async function checkSource(source: RegwatchSource): Promise<RegwatchResult> {
  // Simulera källkontroll (i verkligheten skulle detta göra HTTP-requests)
  // och analysera ändringar med AI
  
  const changes: RegwatchChange[] = []
  
  // Simulera att vi hittar ändringar ibland
  if (Math.random() > 0.7) {
    changes.push({
      sourceId: source.id,
      section: "Artikel 3",
      previousText: "Gammal text...",
      newText: "Ny text med ändringar...",
      effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dagar framåt
      summary: "Uppdatering av definitioner och krav",
      impactAreas: ["AI-system", "Databehandling", "Transparens"],
      severity: Math.random() > 0.5 ? "warning" : "info",
    })
  }
  
  return {
    source,
    changes,
    recommendation: changes.length > 0 
      ? "Granska ändringarna och uppdatera interna processer"
      : "Inga ändringar kräver omedelbar uppmärksamhet",
    checkedAt: new Date().toISOString(),
  }
}

export async function getRegwatchHighlights(limit = 5): Promise<RegwatchResult[]> {
  try {
    const sources = await regwatchRepository.list({ limit })
    
    return sources.map(source => ({
      source: {
        id: source.id,
        title: source.title,
        jurisdiction: source.jurisdiction as "EU" | "Sweden" | "Other",
        url: source.url,
        type: "html" as const,
        lastChecked: source.updatedAt.toISOString(),
        version: source.version,
      },
      changes: source.changes.map(change => ({
        sourceId: source.id,
        section: change.section,
        previousText: change.previousText,
        newText: change.newText,
        effectiveDate: change.effectiveDate?.toISOString(),
        summary: change.summary,
        impactAreas: change.impactAreas as string[],
        severity: change.severity as "info" | "warning" | "critical",
      })),
      recommendation: "Granska ändringarna och uppdatera interna processer",
      checkedAt: source.updatedAt.toISOString(),
    }))
    
  } catch (error) {
    console.error("Failed to get regwatch highlights:", error)
    return []
  }
}

export async function triggerRegwatchCheck(): Promise<RegwatchResult[]> {
  // Manuell utlösning av regwatch-kontroll
  return await executeRegwatchJob()
}
