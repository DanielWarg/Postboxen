"use client"

import { memo } from "react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const decidedAtFormatter = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "medium",
  timeStyle: "short",
})

interface DecisionCardListItem {
  id: string
  meetingId: string
  headline: string
  owner: string
  decidedAt?: string
  recommendation: string
  problem: string
  alternatives: Array<{ label: string; description: string }>
  consequences: string[]
  citations: Array<{
    label: string
    description: string
    url?: string
    law?: string
    article?: string
    version?: string
    publishedAt?: string
  }>
  meeting: {
    id: string
    title: string
    startTime?: string
    persona?: string
    language?: string
  }
}

interface DecisionCardListProps {
  items: DecisionCardListItem[]
}

const formatDecidedAt = (value?: string) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return decidedAtFormatter.format(date)
}

const DecisionCardListComponent = ({ items }: DecisionCardListProps) => {
  const sortedItems = [...items].sort((a, b) => {
    const aTime = a.decidedAt ? new Date(a.decidedAt).getTime() : 0
    const bTime = b.decidedAt ? new Date(b.decidedAt).getTime() : 0
    return bTime - aTime
  })

  if (!sortedItems.length) {
    return (
      <div className="rounded-md border border-dashed border-border/80 bg-background/40 p-8 text-center text-sm text-muted-foreground">
        Inga beslutskort hittades för det aktuella filtret.
      </div>
    )
  }

  return (
    <Accordion type="multiple" className="divide-y divide-border/70 rounded-md border border-border/60 bg-card/50">
      {sortedItems.map((card) => (
        <AccordionItem key={card.id} value={card.id} className="border-b border-border/50 last:border-b-0">
          <AccordionTrigger className="flex flex-col gap-2 px-4 py-3 text-left md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground">{card.headline}</span>
              <span className="text-xs text-muted-foreground">
                {card.meeting.title} · {card.owner}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {card.meeting.persona ? (
                <Badge variant="secondary" className="text-[11px] uppercase tracking-wide">
                  {card.meeting.persona}
                </Badge>
              ) : null}
              <Badge variant="outline" className="text-xs">
                {formatDecidedAt(card.decidedAt)}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-6 bg-background/70 px-6 py-5 text-sm text-foreground">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Rekommendation</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{card.recommendation}</p>
            </section>

            <Separator className="bg-border/80" />

            <section className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Problemställning
                </h4>
                <p className="text-sm leading-relaxed text-foreground">{card.problem}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Konsekvenser
                </h4>
                <ul className="grid gap-1 text-sm text-foreground">
                  {card.consequences.map((consequence, index) => (
                    <li key={`${card.id}-consequence-${index}`}>{consequence}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Alternativ
                </h4>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled>
                  Replay mötessegment
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {card.alternatives.map((alternative, index) => (
                  <div
                    key={`${card.id}-alternative-${index}`}
                    className="rounded-md border border-border/70 bg-background/60 p-3"
                  >
                    <Badge variant="outline" className="mb-2 text-[11px] uppercase">
                      Alternativ {alternative.label}
                    </Badge>
                    <p className="text-sm leading-relaxed text-foreground">{alternative.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {card.citations.length ? (
              <section className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Källor och referenser
                </h4>
                <ul className="space-y-2 text-sm">
                  {card.citations.map((citation, index) => (
                    <li key={`${card.id}-citation-${index}`} className="rounded-md bg-muted/40 p-3">
                      <p className="font-medium text-foreground">{citation.label}</p>
                      <p className="text-xs text-muted-foreground">{citation.description}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {citation.law ? <span>Lag: {citation.law}</span> : null}
                        {citation.article ? <span>Artikel: {citation.article}</span> : null}
                        {citation.version ? <span>Version: {citation.version}</span> : null}
                        {citation.publishedAt ? <span>Publicerad: {citation.publishedAt}</span> : null}
                        {citation.url ? (
                          <a
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                          >
                            Visa källa
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export const DecisionCardList = memo(DecisionCardListComponent)
