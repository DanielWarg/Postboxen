import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { meetingRepository } from "@/lib/db/repositories/meetings"

import { BriefCard } from "./components/brief-card"

type SearchParams = {
  type?: "pre" | "post"
  q?: string
  limit?: string
}

const formatGeneratedAt = (value?: string) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

const briefStats = (briefs: Awaited<ReturnType<typeof meetingRepository.getRecentBriefs>>) => {
  const total = briefs.length
  const meetings = new Set(briefs.map((brief) => brief.meetingId)).size
  const lastGenerated = briefs.reduce<string | undefined>((latest, brief) => {
    if (!brief.generatedAt) return latest
    if (!latest) return brief.generatedAt
    return new Date(brief.generatedAt).getTime() > new Date(latest).getTime() ? brief.generatedAt : latest
  }, undefined)
  return { total, meetings, lastGenerated }
}

export default async function BriefsPage({ searchParams }: { searchParams?: SearchParams }) {
  const typeFilter = searchParams?.type
  const query = searchParams?.q?.trim()
  const limitParam = searchParams?.limit ? Number.parseInt(searchParams.limit, 10) : undefined
  const limit = Number.isFinite(limitParam) && limitParam ? Math.min(Math.max(limitParam, 5), 100) : 50

  const filters = {
    limit,
    variant: typeFilter,
    query: query ?? undefined,
  }

  const [briefs, fallbackBriefs] = await Promise.all([
    meetingRepository.listBriefs(filters),
    meetingRepository.getRecentBriefs(200),
  ])

  const { total, meetings, lastGenerated } = briefStats(briefs)

  const coverage = fallbackBriefs.reduce((acc, brief) => {
    const key = brief.type
    acc.set(key, (acc.get(key) ?? 0) + 1)
    return acc
  }, new Map<string, number>())

  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-4">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">Briefs</h1>
          <p className="text-sm text-muted-foreground">
            För- och efter mötesbriefs genererade av Briefing Engine.
          </p>
        </header>
        <form className="grid gap-3 rounded-md border border-border/60 bg-card/60 p-4 md:grid-cols-4" method="get">
          <div className="md:col-span-2">
            <label htmlFor="brief-search" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sökord
            </label>
            <Input
              id="brief-search"
              type="search"
              name="q"
              defaultValue={query ?? ""}
              placeholder="Sök i ämne eller innehåll"
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="brief-type" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Typ
            </label>
            <select
              id="brief-type"
              name="type"
              defaultValue={typeFilter ?? ""}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Alla</option>
              <option value="pre">För-brief</option>
              <option value="post">Post-brief</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" className="h-10 px-4">
              Filtrera
            </Button>
            <Button asChild variant="ghost" className="h-10 px-3">
              <Link href="/agents/briefs">Rensa</Link>
            </Button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Genererade briefs</CardTitle>
            <CardDescription>Antal i aktuellt filter</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{total}</p>
            <p className="text-xs text-muted-foreground">{meetings} möten representerade</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Senast genererad</CardTitle>
            <CardDescription>Tidpunkt för senaste brief</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-foreground">{formatGeneratedAt(lastGenerated)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Typfördelning</CardTitle>
            <CardDescription>Baseras på senaste 200 briefs</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Array.from(coverage.entries()).map(([variant, count]) => (
              <Badge key={variant} variant="secondary" className="text-xs">
                {variant === "pre" ? "För-brief" : "Post-brief"}: {count}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-4">
        {briefs.length ? (
          briefs.map((brief) => <BriefCard key={`${brief.meetingId}-${brief.type}`} brief={brief} />)
        ) : (
          <div className="rounded-md border border-dashed border-border/80 bg-background/40 p-8 text-center text-sm text-muted-foreground">
            Inga briefs matchade filtret.
          </div>
        )}
      </div>
    </div>
  )
}
