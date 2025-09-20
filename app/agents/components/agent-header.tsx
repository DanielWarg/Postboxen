"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function AgentHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="size-9" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-muted-foreground">Agentpanelen</span>
          <h1 className="text-xl font-semibold leading-tight text-foreground">Överblick och styrning</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 shadow-sm md:flex">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Miljö</span>
          <span className="text-sm font-medium text-foreground">Pilot</span>
        </div>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="hidden items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-left text-sm md:flex">
              <span className="font-medium text-foreground">Senaste uppdatering</span>
              <span className="text-muted-foreground">för 3 min sedan</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Synkas med Postgres och Redis heartbeat.
          </TooltipContent>
        </Tooltip>
        <Input
          type="search"
          placeholder="Sök möte, beslutsunderlag eller deltagare"
          className="hidden w-64 md:block"
        />
        <Button variant="outline" size="sm">
          Exportera rapport
        </Button>
        <Button size="sm">
          Schemalägg möte
        </Button>
      </div>
    </header>
  )
}
