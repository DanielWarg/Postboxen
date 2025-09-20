import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const generatedAtFormatter = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "medium",
  timeStyle: "short",
})

export interface BriefCardProps {
  brief: {
    type: "pre" | "post"
    generatedAt: string
    subject: string
    headline: string
    keyPoints: string[]
    decisions?: string[]
    risks?: string[]
    nextSteps?: string[]
    content: string
    meetingTitle: string
  }
}

const briefTypeLabel = (type: "pre" | "post") => (type === "pre" ? "För-brief" : "Post-brief")

export function BriefCard({ brief }: BriefCardProps) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">{brief.subject}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {brief.meetingTitle}
          </CardDescription>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <Badge variant="secondary" className="text-xs uppercase">
            {briefTypeLabel(brief.type)}
          </Badge>
          <span className="text-xs text-muted-foreground">{generatedAtFormatter.format(new Date(brief.generatedAt))}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-foreground">
        <section className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Sammanfattning</h3>
          <p className="leading-relaxed text-muted-foreground">{brief.headline}</p>
        </section>
        {brief.keyPoints.length ? (
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nyckelpunkter</h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
              {brief.keyPoints.map((point, index) => (
                <li key={`${brief.type}-${brief.generatedAt}-point-${index}`}>{point}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {brief.decisions?.length ? (
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Beslut</h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
              {brief.decisions.map((decision, index) => (
                <li key={`${brief.type}-${brief.generatedAt}-decision-${index}`}>{decision}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {brief.risks?.length ? (
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Risker</h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
              {brief.risks.map((risk, index) => (
                <li key={`${brief.type}-${brief.generatedAt}-risk-${index}`}>{risk}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {brief.nextSteps?.length ? (
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nästa steg</h4>
            <ol className="list-inside list-decimal space-y-1 text-sm text-foreground">
              {brief.nextSteps.map((step, index) => (
                <li key={`${brief.type}-${brief.generatedAt}-step-${index}`}>{step}</li>
              ))}
            </ol>
          </section>
        ) : null}
        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Innehåll</h4>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{brief.content}</p>
        </section>
      </CardContent>
    </Card>
  )
}
