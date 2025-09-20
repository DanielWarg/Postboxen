import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const effectiveDateFormatter = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "medium",
})

interface RegulationChangeCardProps {
  change: {
    id: string
    section: string
    summary: string
    impactAreas: string[]
    severity: "info" | "warning" | "critical"
    effectiveDate?: string
    previousText?: string
    newText?: string
  }
  source: {
    title: string
    jurisdiction: string
    version: string
    url: string
  }
}

const severityLabel = (severity: RegulationChangeCardProps["change"]["severity"]) => {
  switch (severity) {
    case "critical":
      return "Kritisk"
    case "warning":
      return "Varning"
    default:
      return "Info"
  }
}

const severityVariant = (severity: RegulationChangeCardProps["change"]["severity"]) => {
  switch (severity) {
    case "critical":
      return "destructive" as const
    case "warning":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

export function RegulationCard({ change, source }: RegulationChangeCardProps) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground">{source.title}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {source.jurisdiction} • Version {source.version}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={severityVariant(change.severity)} className="text-xs uppercase">
            {severityLabel(change.severity)}
          </Badge>
          {change.effectiveDate ? (
            <Badge variant="outline" className="text-xs">
              Gäller {effectiveDateFormatter.format(new Date(change.effectiveDate))}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-foreground">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">{change.section}</h3>
          <p className="leading-relaxed text-muted-foreground">{change.summary}</p>
        </section>
        {change.impactAreas.length ? (
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Påverkan</h4>
            <div className="flex flex-wrap gap-2">
              {change.impactAreas.map((impact) => (
                <Badge key={impact} variant="secondary" className="text-xs">
                  {impact}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}
        {(change.previousText || change.newText) ? (
          <section className="grid gap-4 md:grid-cols-2">
            {change.previousText ? (
              <div className="space-y-1 rounded-md border border-border/70 bg-background/50 p-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tidigare lydelse</h4>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{change.previousText}</p>
              </div>
            ) : null}
            {change.newText ? (
              <div className="space-y-1 rounded-md border border-border/70 bg-background/50 p-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ny lydelse</h4>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{change.newText}</p>
              </div>
            ) : null}
          </section>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Källa:</span>
          <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
            Öppna originaltext
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
