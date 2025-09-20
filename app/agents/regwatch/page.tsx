import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { regwatchRepository } from "@/lib/db/repositories/regwatch"

import { RegulationCard } from "./components/regulation-card"

type SearchParams = {
  severity?: "info" | "warning" | "critical"
  jurisdiction?: string
  q?: string
}

const severityOptions = [
  { value: "", label: "Alla" },
  { value: "critical", label: "Kritisk" },
  { value: "warning", label: "Varning" },
  { value: "info", label: "Info" },
]

export default async function RegwatchPage({ searchParams }: { searchParams?: SearchParams }) {
  const severityFilter = searchParams?.severity
  const jurisdictionFilter = searchParams?.jurisdiction
  const query = searchParams?.q?.trim()

  const sources = await regwatchRepository.list({
    severity: severityFilter,
    jurisdiction: jurisdictionFilter,
    query: query ?? undefined,
  })

  const changes = sources.flatMap((source) =>
    source.changes.map((change) => ({
      id: change.id,
      section: change.section,
      summary: change.summary,
      impactAreas: Array.isArray(change.impactAreas) ? (change.impactAreas as string[]) : [],
      severity: change.severity as "info" | "warning" | "critical",
      effectiveDate: change.effectiveDate?.toISOString(),
      previousText: change.previousText,
      newText: change.newText,
      source: {
        title: source.title,
        jurisdiction: source.jurisdiction,
        version: source.version,
        url: source.url,
      },
    })),
  )

  const totalSources = sources.length
  const totalChanges = changes.length
  const criticalCount = changes.filter((change) => change.severity === "critical").length

  const jurisdictions = new Map<string, number>()
  for (const source of sources) {
    jurisdictions.set(source.jurisdiction, (jurisdictions.get(source.jurisdiction) ?? 0) + 1)
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-4">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">Regwatch</h1>
          <p className="text-sm text-muted-foreground">
            Samlade regelförändringar från EU AI Act, GDPR och LOU med rekommendationer.
          </p>
        </header>
        <form className="grid gap-3 rounded-md border border-border/60 bg-card/60 p-4 md:grid-cols-4" method="get">
          <div className="md:col-span-2">
            <label htmlFor="regwatch-search" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sökord
            </label>
            <Input
              id="regwatch-search"
              type="search"
              name="q"
              defaultValue={query ?? ""}
              placeholder="Sök i källnamn eller sammanfattning"
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="regwatch-severity" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Allvar
            </label>
            <select
              id="regwatch-severity"
              name="severity"
              defaultValue={severityFilter ?? ""}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {severityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="regwatch-jurisdiction" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Jurisdiktion
            </label>
            <select
              id="regwatch-jurisdiction"
              name="jurisdiction"
              defaultValue={jurisdictionFilter ?? ""}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Alla</option>
              {Array.from(jurisdictions.entries()).map(([jurisdiction]) => (
                <option key={jurisdiction} value={jurisdiction}>
                  {jurisdiction}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" className="h-10 px-4">
              Filtrera
            </Button>
            <Button asChild variant="ghost" className="h-10 px-3">
              <Link href="/agents/regwatch">Rensa</Link>
            </Button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Källor</CardTitle>
            <CardDescription>Antal regler refererade</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{totalSources}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Förändringar</CardTitle>
            <CardDescription>Filtrerade poster</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{totalChanges}</p>
            <p className="text-xs text-muted-foreground">Varav {criticalCount} kritiska</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jurisdiktioner</CardTitle>
            <CardDescription>Representerade källor</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Array.from(jurisdictions.entries()).map(([jurisdiction, count]) => (
              <Badge key={jurisdiction} variant="secondary" className="text-xs">
                {jurisdiction}: {count}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </section>

      <Separator className="bg-border/80" />

      <div className="grid gap-4">
        {changes.length ? (
          changes.map((change) => (
            <RegulationCard key={change.id} change={change} source={change.source} />
          ))
        ) : (
          <div className="rounded-md border border-dashed border-border/80 bg-background/40 p-8 text-center text-sm text-muted-foreground">
            Inga regelförändringar matchade filtret.
          </div>
        )}
      </div>
    </div>
  )
}
