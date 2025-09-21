"use client"

import { useState, useEffect, useCallback } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  CheckCircle2, 
  ClipboardList, 
  FileText, 
  Gauge, 
  Info, 
  Layers, 
  LineChart, 
  Lock, 
  NotebookPen, 
  ShieldCheck, 
  Sparkles, 
  Terminal, 
  Users 
} from "lucide-react"

interface SpotlightOption {
  key: string
  title: string
  badge: string
  icon: any
  description: string
}

const SPOTLIGHT_OPTIONS: SpotlightOption[] = [
  {
    key: "meetings",
    title: "Möten",
    badge: "översikt",
    icon: Calendar,
    description: "Aktiva möten, schemaläggning och mötesöversikt"
  },
  {
    key: "decisions",
    title: "Beslut",
    badge: "beslutskort",
    icon: CheckCircle2,
    description: "Beslutskort, alternativ och rekommendationer"
  },
  {
    key: "actions",
    title: "Åtgärder",
    badge: "uppföljning",
    icon: ClipboardList,
    description: "Åtgärdsuppföljning och deadline-hantering"
  },
  {
    key: "briefs",
    title: "Briefs",
    badge: "dokumentation",
    icon: FileText,
    description: "Pre- och post-briefs för möten"
  },
  {
    key: "regwatch",
    title: "Regwatch",
    badge: "compliance",
    icon: Layers,
    description: "Regelverksövervakning och ändringar"
  },
  {
    key: "compliance",
    title: "Compliance",
    badge: "säkerhet",
    icon: Lock,
    description: "Säkerhet, audit och compliance-översikt"
  },
  {
    key: "observability",
    title: "Observability",
    badge: "hälsa & kostnad",
    icon: LineChart,
    description: "SLO, fel, kostnad och latens per möte"
  },
  {
    key: "monitoring",
    title: "Monitoring",
    badge: "system & prestanda",
    icon: Gauge,
    description: "Real-time system metrics och prestanda"
  },
  {
    key: "slash-commands",
    title: "Slash-kommandon",
    badge: "power user",
    icon: Terminal,
    description: "Snabbkommandon för Teams, Zoom och Webex"
  },
  {
    key: "magic-invite",
    title: "Magisk inbjudan",
    badge: "onboarding",
    icon: Sparkles,
    description: "Skapa unika inbjudningar för AI-kollega"
  },
  {
    key: "consent",
    title: "Samtycke",
    badge: "GDPR",
    icon: ShieldCheck,
    description: "GDPR-compliant samtyckeshantering"
  }
]

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectSpotlight: (spotlight: string) => void
  currentSpotlight: string
}

export function CommandPalette({ open, onOpenChange, onSelectSpotlight, currentSpotlight }: CommandPaletteProps) {
  const [search, setSearch] = useState("")

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        onOpenChange(!open)
      }
      
      if (event.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  const handleSelect = useCallback((spotlightKey: string) => {
    onSelectSpotlight(spotlightKey)
    onOpenChange(false)
    setSearch("")
  }, [onSelectSpotlight, onOpenChange])

  const filteredOptions = SPOTLIGHT_OPTIONS.filter(option =>
    option.title.toLowerCase().includes(search.toLowerCase()) ||
    option.description.toLowerCase().includes(search.toLowerCase()) ||
    option.badge.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <Command className="rounded-lg border shadow-md">
          <CommandInput 
            placeholder="Sök spotlight eller tryck på en tangent..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Ingen spotlight hittades.</CommandEmpty>
            <CommandGroup heading="Spotlights">
              {filteredOptions.map((option) => {
                const Icon = option.icon
                const isActive = option.key === currentSpotlight
                
                return (
                  <CommandItem
                    key={option.key}
                    value={option.key}
                    onSelect={() => handleSelect(option.key)}
                    className="flex items-center gap-3 p-3"
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.title}</span>
                        <Badge variant="secondary" className="text-xs">
                          {option.badge}
                        </Badge>
                        {isActive && (
                          <Badge variant="default" className="text-xs">
                            Aktiv
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        
        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground border-t">
          <div className="flex items-center gap-4">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘K</kbd>
            <span>Öppna Command Palette</span>
          </div>
          <div className="flex items-center gap-4">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">↑↓</kbd>
            <span>Navigera</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">↵</kbd>
            <span>Välj</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
            <span>Stäng</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
