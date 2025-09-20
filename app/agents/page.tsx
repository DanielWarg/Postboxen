import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { meetingRepository } from "@/lib/db/repositories/meetings"
import { regwatchRepository } from "@/lib/db/repositories/regwatch"
import { RetentionCard } from "./components/retention-card"
import { RegwatchCard } from "./components/regwatch-card"

const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

const fetchMeetings = async () => {
  try {
    const meetings = await meetingRepository.getMeetingOverview()
    return { meetings }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Okänt fel"
    return { meetings: [], error: message }
  }
}

const fetchRecentDecisionCards = async (limit = 3) => {
  try {
    return await meetingRepository.getRecentDecisionCards(limit)
  } catch (error) {
    console.error("Misslyckades att hämta beslut", error)
    return []
  }
}

const fetchRecentBriefs = async (limit = 3) => {
  try {
    return await meetingRepository.getRecentBriefs(limit)
  } catch (error) {
    console.error("Misslyckades att hämta briefs", error)
    return []
  }
}

type RegwatchHighlight = {
  id: string
  sourceTitle: string
  section: string
  summary: string
  impact: string
  severity: "info" | "warning" | "critical"
  effectiveDate?: string
}

const fetchRegwatchHighlights = async (limit = 3): Promise<RegwatchHighlight[]> => {
  try {
    const sources = await regwatchRepository.list()
    const highlights: RegwatchHighlight[] = []
    for (const source of sources) {
      for (const change of source.changes) {
        highlights.push({
          id: change.id,
          sourceTitle: source.title,
          section: change.section,
          summary: change.summary,
          severity: (change.severity as RegwatchHighlight["severity"]) ?? "info",
          impact: toReadableImpact(change.impactAreas),
          effectiveDate: change.effectiveDate ? change.effectiveDate.toISOString() : undefined,
        })
      }
    }
    return highlights.sort((a, b) => (b.effectiveDate ?? "").localeCompare(a.effectiveDate ?? "")).slice(0, limit)
  } catch (error) {
    console.error("Misslyckades att hämta regwatch", error)
    return []
  }
}

const computeStatus = (start?: Date | string | null, end?: Date | string | null) => {
  if (!start || !end) return { label: "Okänt", variant: "secondary" as const }
  const startDate = typeof start === "string" ? new Date(start) : start
  const endDate = typeof end === "string" ? new Date(end) : end
  const now = Date.now()
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { label: "Okänt", variant: "secondary" as const }
  }
  if (endDate.getTime() < now) {
    return { label: "Avslutat", variant: "outline" as const }
  }
  if (startDate.getTime() > now) {
    return { label: "Kommande", variant: "secondary" as const }
  }
  return { label: "Pågår", variant: "default" as const }
}

const formatDate = (value?: Date | string | null) => {
  if (!value) return "-"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "-"
  return dateFormatter.format(date)
}

const toTimestamp = (value?: Date | string | null) => {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(value)
  const timestamp = date.getTime()
  if (Number.isNaN(timestamp)) return undefined
  return timestamp
}

const toReadableImpact = (value: unknown) => {
  if (!Array.isArray(value)) return ""
  const items = value
    .map((item) => (typeof item === "string" ? item : undefined))
    .filter((item): item is string => Boolean(item))
  return items.join(", ")
}

const briefLabel = (type: string) => {
  switch (type) {
    case "pre":
      return "För-brief"
    case "post":
      return "Post-brief"
    default:
      return type
  }
}

const severityVariant = (severity: RegwatchHighlight["severity"]): "outline" | "secondary" | "destructive" => {
  switch (severity) {
    case "critical":
      return "destructive"
    case "warning":
      return "secondary"
    default:
      return "outline"
  }
}

export default async function AgentsDashboardPage() {
  const { meetings, error } = await fetchMeetings()
  const [decisions, briefs, regwatch] = await Promise.all([
    fetchRecentDecisionCards(),
    fetchRecentBriefs(),
    fetchRegwatchHighlights(),
  ])

  const now = Date.now()
  const metrics = buildMetrics(meetings, now)

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Kan inte ladda möten just nu</AlertTitle>
          <AlertDescription>
            {error}. Kontrollera Postgres-anslutningen eller försök igen senare.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-border/60 bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
              <CardDescription>{metric.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-semibold text-foreground">
                  {metric.value}
                </span>
                {metric.delta ? (
                  <Badge variant="secondary" className="px-2 py-1 text-xs">
                    {metric.delta}
                  </Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border-border/60 bg-card/60">
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">Mötesöversikt</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Hämtar status från Postgres och visar beslut och åtgärder per möte.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Hantera filter
          </Button>
        </CardHeader>
        <CardContent>
          {meetings.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Möte</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>Slut</TableHead>
                    <TableHead>Organisatör</TableHead>
                    <TableHead className="text-center">Beslut</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings.map((meeting) => {
                    const status = computeStatus(meeting.startTime, meeting.endTime)
                    return (
                      <TableRow key={meeting.id}>
                        <TableCell className="font-medium text-foreground">
                          <div className="flex flex-col">
                            <span>{meeting.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {meeting.id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(meeting.startTime)}</TableCell>
                        <TableCell>{formatDate(meeting.endTime)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-foreground">
                            {meeting.organizerEmail}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium">
                          {meeting.decisions.length}
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium">
                          {meeting.actionItems.length}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid place-items-center rounded-md border border-dashed border-border/80 py-12 text-center">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Inga möten hittades</h3>
                <p className="text-sm text-muted-foreground">
                  Schemalägg via API:t eller använd knappen ovanför för att lägga till nästa möte.
                </p>
                <Button size="sm">Schemalägg första mötet</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Decision cards</CardTitle>
                <CardDescription>Sammanfattar AI-upptäckta beslut.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">Live-data</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {decisions.length ? (
              decisions.map((decision) => (
                <div key={decision.id} className="rounded-md border border-border/80 bg-background/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{decision.headline}</span>
                    <Badge variant="secondary" className="text-[11px]">
                      {formatDate(decision.decidedAt)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{decision.meetingTitle}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Ägare: <span className="font-medium text-foreground">{decision.owner}</span>
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-border/80 bg-background/40 p-6 text-center text-sm text-muted-foreground">
                Inga beslut har registrerats ännu.
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button variant="ghost" size="sm">
              Visa alla
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Briefs</CardTitle>
                <CardDescription>Senaste utskick från Briefing Engine.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">Live-data</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {briefs.length ? (
              briefs.map((brief) => (
                <div key={`${brief.meetingTitle}-${brief.type}`} className="flex items-center justify-between gap-3 rounded-md border border-border/80 bg-background/50 p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{briefLabel(brief.type)}</span>
                    <span className="text-xs text-muted-foreground">{brief.meetingTitle}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{formatDate(brief.generatedAt)}</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-border/80 bg-background/40 p-6 text-center text-sm text-muted-foreground">
                Inga briefer är genererade ännu.
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button variant="ghost" size="sm">
              Hantera utskick
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Regwatch</CardTitle>
                <CardDescription>Färska regulatoriska förändringar.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">Live-data</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {regwatch.length ? (
              regwatch.map((item) => (
                <div key={item.id} className="rounded-md border border-border/80 bg-background/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{item.sourceTitle}</span>
                    <Badge variant={severityVariant(item.severity)} className="text-xs">
                      {item.severity === "critical" ? "Kritisk" : item.severity === "warning" ? "Varning" : "Info"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs font-medium text-foreground">{item.section}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.summary}</p>
                  {item.impact ? (
                    <p className="mt-2 text-xs text-muted-foreground">Påverkan: {item.impact}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-border/80 bg-background/40 p-6 text-center text-sm text-muted-foreground">
                Inga regwatch-notiser har registrerats ännu.
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button variant="ghost" size="sm">
              Gå till Regwatch
            </Button>
          </CardFooter>
        </Card>

        <RetentionCard
          userEmail="admin@postboxen.se"
          profile="juridik"
        />

        <RegwatchCard />
      </section>
    </div>
  )
}

const buildMetrics = (
  meetings: Awaited<ReturnType<typeof meetingRepository.getMeetingOverview>>,
  now: number,
) => {
  const twoWeeks = 14 * 24 * 60 * 60 * 1000
  const pastWeek = 7 * 24 * 60 * 60 * 1000

  const upcoming = meetings.filter((meeting) => {
    const start = toTimestamp(meeting.startTime)
    if (start === undefined) return false
    return start > now && start - now <= twoWeeks
  }).length

  const lastSevenDays = meetings.filter((meeting) => {
    const created = toTimestamp(meeting.createdAt)
    if (created === undefined) return false
    return now - created <= pastWeek
  }).length

  const totalActions = meetings.reduce((sum, meeting) => sum + meeting.actionItems.length, 0)
  const totalDecisions = meetings.reduce((sum, meeting) => sum + meeting.decisions.length, 0)

  return [
    {
      label: "Planerade möten",
      value: upcoming,
      description: "Nästa två veckor",
      delta: upcoming ? `${upcoming} i pipeline` : undefined,
    },
    {
      label: "Aktiva senaste 7 dagarna",
      value: lastSevenDays,
      description: "Synkade via scheduler och webhooks",
      delta: lastSevenDays ? `${lastSevenDays} nya` : undefined,
    },
    {
      label: "Åtgärder & beslut",
      value: totalActions + totalDecisions,
      description: "Summa öppna actions och beslutspunkter",
      delta: totalActions + totalDecisions ? `${totalActions} actions · ${totalDecisions} beslut` : undefined,
    },
  ]
}
