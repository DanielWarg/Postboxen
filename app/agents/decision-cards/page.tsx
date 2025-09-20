import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { meetingRepository } from "@/lib/db/repositories/meetings"

import { DecisionCardList } from "./components/decision-card-list"

type SearchParams = {
  persona?: string
  q?: string
  limit?: string
}

const UNKNOWN_PERSONA_VALUE = "__unknown__"

const dateTimeFormatter = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "medium",
  timeStyle: "short",
})

const formatDecidedAt = (value?: string) => {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"
  return dateTimeFormatter.format(parsed)
}

const toPersonaKey = (persona?: string | null) => persona ?? UNKNOWN_PERSONA_VALUE
const personaLabel = (persona?: string | null) => persona ?? "Okänd persona"

export default async function DecisionCardsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const personaParamRaw = resolvedSearchParams?.persona ?? undefined
  const queryParam = resolvedSearchParams?.q?.trim() || undefined
  const limitParam = resolvedSearchParams?.limit ? Number.parseInt(resolvedSearchParams.limit, 10) : undefined
  const limit = Number.isFinite(limitParam) && limitParam ? Math.min(Math.max(limitParam, 5), 100) : 50

  const personaFilter =
    personaParamRaw === undefined || personaParamRaw === ""
      ? undefined
      : personaParamRaw === UNKNOWN_PERSONA_VALUE
        ? null
        : personaParamRaw

  const [decisionCards, personaUniverse] = await Promise.all([
    meetingRepository.listDecisionCards({ limit, persona: personaFilter, query: queryParam }),
    meetingRepository.listDecisionCards({ limit: 200 }),
  ])

  const personaHistogram = personaUniverse.reduce((acc, card) => {
    const key = toPersonaKey(card.meeting.persona)
    const current = acc.get(key)
    acc.set(key, {
      persona: card.meeting.persona ?? null,
      count: current ? current.count + 1 : 1,
    })
    return acc
  }, new Map<string, { persona: string | null; count: number }>())

  const personaOptions = Array.from(personaHistogram.entries())
    .map(([key, value]) => ({
      key,
      label: personaLabel(value.persona),
      count: value.count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "sv"))

  const filteredPersonaDistribution = decisionCards.reduce((acc, card) => {
    const key = personaLabel(card.meeting.persona)
    acc.set(key, (acc.get(key) ?? 0) + 1)
    return acc
  }, new Map<string, number>())

  const totalDecisions = decisionCards.length
  const distinctMeetings = new Set(decisionCards.map((card) => card.meetingId)).size
  const mostRecent = decisionCards.reduce<string | undefined>((latest, card) => {
    if (!card.decidedAt) return latest
    if (!latest) return card.decidedAt
    return new Date(card.decidedAt).getTime() > new Date(latest).getTime() ? card.decidedAt : latest
  }, undefined)

  const personaFilterActive = personaFilter !== undefined

  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-4">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">Decision cards</h1>
          <p className="text-sm text-muted-foreground">
            AI-upptäckta beslut och rekommendationer. Filtrera per persona eller sök i rubriker och motiveringar.
          </p>
        </header>

        <form className="grid gap-3 rounded-md border border-border/60 bg-card/60 p-4 md:grid-cols-4" method="get">
          <div className="md:col-span-2">
            <label htmlFor="decision-search" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sökord
            </label>
            <Input
              id="decision-search"
              type="search"
              name="q"
              defaultValue={queryParam ?? ""}
              placeholder="Sök på rubrik, problem eller rekommendation"
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="decision-persona" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Persona
            </label>
            <select
              id="decision-persona"
              name="persona"
              defaultValue={personaParamRaw ?? ""}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Alla</option>
              {personaOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                  {option.count ? ` (${option.count})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" className="h-10 px-4">
              Filtrera
            </Button>
            <Button asChild variant="ghost" className="h-10 px-3">
              <Link href="/agents/decision-cards">Rensa</Link>
            </Button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Beslutskort</CardTitle>
            <CardDescription>Antal som matchar filtret</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{totalDecisions}</p>
            <p className="text-xs text-muted-foreground">{distinctMeetings} möten representerade</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Senaste beslut</CardTitle>
            <CardDescription>Datum för senaste uppdatering</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-foreground">{formatDecidedAt(mostRecent)}</p>
            <p className="text-xs text-muted-foreground">Av {decisionCards[0]?.owner ?? "okänd"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Persona-spridning</CardTitle>
            <CardDescription>Visar endast valda resultat</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {filteredPersonaDistribution.size ? (
              Array.from(filteredPersonaDistribution.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([label, count]) => (
                  <Badge key={label} variant="secondary" className="text-xs">
                    {label}: {count}
                  </Badge>
                ))
            ) : (
              <span className="text-xs text-muted-foreground">Ingen data än</span>
            )}
          </CardContent>
        </Card>
      </section>

      {personaOptions.length > 0 && !personaFilterActive ? (
        <section className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Personae:</span>
          {personaOptions.map((option) => (
            <Badge key={option.key} variant="outline" className="text-xs">
              {option.label}: {option.count}
            </Badge>
          ))}
        </section>
      ) : null}

      <DecisionCardList items={decisionCards} />
    </div>
  )
}
