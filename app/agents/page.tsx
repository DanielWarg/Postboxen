"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  BellDot,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
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
  Timer,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MonitoringDashboard } from "./components/monitoring-dashboard";
import { SlashCommandsCard } from "./components/slash-commands-card";
import { MagicInviteCard } from "./components/magic-invite-card";
import { ConsentCard } from "./components/consent-card";

// ------------------------------------------------------------
// Minimal, lugn dashboard i ljust tema med "Spotlight"-ytor.
// Lägg filen som app/page.tsx i en Next.js (App Router) app.
// Förutsätter Tailwind + shadcn/ui + lucide-react installerat.
// ------------------------------------------------------------

export default function Dashboard() {
  const [spotlight, setSpotlight] = useState<SpotlightKey>("meetings");
  const [meetingId, setMeetingId] = useState<string>("Q3-Strategy-001");
  const [compact, setCompact] = useState<boolean>(true);

  const current = useMemo(() => SPOTLIGHTS[spotlight], [spotlight]);

  // --- Dev smoke tests (körs i dev) ---
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      const errors = validateSpotlights(SPOTLIGHTS);
      if (errors.length) {
        // Visa i konsol så man kan agera, men stör inte UI.
        console.warn("[Dashboard:SpotlightValidation]", errors);
      }
    }
  }, []);

  // Säker rendering av ikon & komponent (undviker JSX med potentiellt undefined)
  const Icon = current?.icon ?? Info;
  const Comp = current?.Component ?? (() => (
    <div className="text-sm text-red-600">Saknar komponent för denna spotlight.</div>
  ));

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header compact={compact} onCompactChange={setCompact} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid gap-6">
        {/* Top controls */}
        <Card className="border-slate-200">
          <CardContent className="pt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-slate-500" />
              <div>
                <h2 className="text-xl font-semibold">Spotlight</h2>
                <p className="text-sm text-slate-500">
                  Välj fokus. En sak i taget. Allt annat håller sig lugnt i bakgrunden.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <SpotlightSelect value={spotlight} onChange={setSpotlight} />
              <MeetingSelect value={meetingId} onChange={setMeetingId} />
            </div>
          </CardContent>
        </Card>

        {/* KPI strip (liten, låg visuell tyngd) */}
        <div className={cn("grid gap-4", compact ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-4") }>
          <KpiCard icon={Timer} label="Sparad tid / möte" value="+14 min" sub="snitt senaste 30 dagar" />
          <KpiCard icon={CheckCircle2} label="Uppföljda inom 48h" value="+38%" sub="vs föreg. månad" />
          <KpiCard icon={Gauge} label="Kostnad / möte" value="23 kr" sub="inkl. STT + LLM" />
          {!compact && (
            <KpiCard icon={Users} label="Mötesdisciplin" value="B+" sub="taltid/avbrott trend" />
          )}
        </div>

        {/* Spotlight panel */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-slate-500" />
                <CardTitle className="text-lg">{current.title}</CardTitle>
                <Badge variant="secondary" className="rounded-full">{current.badge}</Badge>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Info className="h-4 w-4" /> Hjälp
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>{current.title} – hjälp</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <p>{current.help}</p>
                    <Separator />
                    <p className="text-slate-500">Tips: Använd Spotlight-väljaren för att hålla fokus. Du kan växla när som helst utan att tappa kontext.</p>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            {current.description && (
              <CardDescription className="pt-1">{current.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Comp meetingId={meetingId} compact={compact} />
          </CardContent>
        </Card>

        {/* Quick actions: alltid få, alltid tydliga */}
        <QuickActions />
      </div>
    </main>
  );
}

// -------------------- Spotlight Config ----------------------

type SpotlightKey =
  | "meetings"
  | "decisions"
  | "actions"
  | "briefs"
  | "regwatch"
  | "compliance"
  | "observability"
  | "monitoring"
  | "slash-commands"
  | "magic-invite"
  | "consent";

interface SpotlightDef {
  key: SpotlightKey;
  title: string;
  badge: string;
  icon: React.ComponentType<any>;
  description?: string;
  help: string;
  Component: React.ComponentType<{ meetingId: string; compact: boolean }>;
}

const SPOTLIGHTS: Record<SpotlightKey, SpotlightDef> = {
  meetings: {
    key: "meetings",
    title: "Möten",
    badge: "planerat & pågående",
    icon: CalendarClock,
    description: "Se kommande/pågående möten och välj vilket som är aktivt.",
    help: "Här väljer du möte att fokusera på. Du kan snabbt byta genom listan till höger eller via mötesväljaren högst upp.",
    Component: MeetingsPanel,
  },
  decisions: {
    key: "decisions",
    title: "Beslut",
    badge: "fångade i mötet",
    icon: NotebookPen,
    description: "Allt vi beslöt – med ägare, deadline och källcitat.",
    help: "Beslut skapas automatiskt från tal/anteckningar. Sätt ägare och deadline här, eller skicka vidare till Planner/Jira/Trello.",
    Component: DecisionsPanel,
  },
  actions: {
    key: "actions",
    title: "Åtgärder",
    badge: "48h-nudges",
    icon: ClipboardList,
    description: "Uppföljning som faktiskt händer. Nudges tills någon agerar.",
    help: "Alla åtgärder från möten samlas här. Du kan markera klara, justera deadlines och se vilka som nudgats.",
    Component: ActionsPanel,
  },
  briefs: {
    key: "briefs",
    title: "Briefs",
    badge: "pre & post",
    icon: FileText,
    description: "För-brief 30 min före och post-brief efter mötet.",
    help: "Pre-brief sammanfattar läget innan mötet. Post-brief ger tre beslut, tre risker, tre nästa steg – redo för ledning/kund.",
    Component: BriefsPanel,
  },
  regwatch: {
    key: "regwatch",
    title: "Regwatch",
    badge: "EU/Sverige",
    icon: Layers,
    description: "Ändringar i regelverk som berör ert arbete.",
    help: "Vi bevakar EU- och svenska källor. När något ändras får du en friendly diff och förslag på ny formulering.",
    Component: RegwatchPanel,
  },
  compliance: {
    key: "compliance",
    title: "Compliance",
    badge: "samtycke & retention",
    icon: ShieldCheck,
    description: "Samtyckesprofiler, radering, och audit-kvitton.",
    help: "Välj Bas/Plus/Juridik per möte. Exportera consent receipts. Radera allt för ett möte med ett klick.",
    Component: CompliancePanel,
  },
  observability: {
    key: "observability",
    title: "Observability",
    badge: "hälsa & kostnad",
    icon: LineChart,
    description: "SLO, fel, kostnad och latens per möte.",
    help: "Här ser du teknisk hälsa och kostnad. Bra för drift och optimering – men snyggt nedtonat för att inte störa.",
    Component: ObservabilityPanel,
  },
  monitoring: {
    key: "monitoring",
    title: "Monitoring",
    badge: "system & prestanda",
    icon: Gauge,
    description: "Real-time system metrics, health monitoring och prestanda.",
    help: "Övervaka systemhälsa, resursanvändning, köer och affärsmetrics i realtid.",
    Component: MonitoringPanel,
  },
  "slash-commands": {
    key: "slash-commands",
    title: "Slash-kommandon",
    badge: "power user",
    icon: Terminal,
    description: "Snabbkommandon för Teams, Zoom, Google Meet och Webex.",
    help: "Power user-funktioner för direkt åtkomst till AI-kollega i mötesplattformarna.",
    Component: SlashCommandsPanel,
  },
  "magic-invite": {
    key: "magic-invite",
    title: "Magisk inbjudan",
    badge: "onboarding",
    icon: Sparkles,
    description: "Skapa unika inbjudningar för AI-kollega som användare kan dela.",
    help: "Onboarding-funktionalitet för att enkelt bjuda in AI-kollegan till möten.",
    Component: MagicInvitePanel,
  },
  consent: {
    key: "consent",
    title: "Samtycke",
    badge: "GDPR",
    icon: ShieldCheck,
    description: "GDPR-compliant samtyckeshantering för mötesdokumentation.",
    help: "Hantera samtyckesprofiler, datalagring och compliance för alla möten.",
    Component: ConsentPanel,
  },
};

function SpotlightSelect({ value, onChange }: { value: SpotlightKey; onChange: (k: SpotlightKey) => void }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as SpotlightKey)} className="w-full md:w-auto">
      <TabsList className="grid grid-cols-4 md:grid-cols-11 w-full">
        {Object.values(SPOTLIGHTS).map((s) => (
          <TabsTrigger key={s.key} value={s.key} className="text-xs md:text-sm">
            {s.title}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function MeetingSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full md:w-[280px]">
        <SelectValue placeholder="Välj möte" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Q3-Strategy-001">Q3-strategi – 2025-09-22 09:00</SelectItem>
        <SelectItem value="Anbud-UL-042">Anbud UL – 2025-09-23 13:00</SelectItem>
        <SelectItem value="Styrelse-025">Styrelse – 2025-09-24 15:00</SelectItem>
      </SelectContent>
    </Select>
  );
}

// -------------------- Panels ----------------------

function MeetingsPanel({ meetingId, compact }: { meetingId: string; compact: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Valt möte</CardTitle>
          <CardDescription className="text-slate-600">{meetingId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CalendarClock className="h-4 w-4" />
            22 sep 09:00–10:00 • Teams • 6 deltagare
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Agenda</h4>
            <ul className="text-sm list-disc pl-5 space-y-1 text-slate-700">
              <li>Status rundan</li>
              <li>Besluta om leveransplan</li>
              <li>Risker & blockare</li>
            </ul>
          </div>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Auto-join på</Badge>
            <Badge variant="outline">Samtycke: Bas</Badge>
            <Badge variant="outline">Recording: Cloud</Badge>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Snabbval</CardTitle>
          <CardDescription>Styr mötet på 1 klick</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" variant="default">Bjud in Kollegan</Button>
          <Button className="w-full" variant="secondary">Koppla kalender</Button>
          <Button className="w-full" variant="outline">Kör demo-möte</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function DecisionsPanel({ meetingId, compact }: { meetingId: string; compact: boolean }) {
  const items = [
    { id: "D-101", text: "Lansera pilot 15 okt", owner: "Anna", due: "2025-10-15" },
    { id: "D-102", text: "Förhandla pris med leverantör", owner: "Johan", due: "2025-09-28" },
  ];
  return (
    <div className="space-y-3">
      {items.map((d) => (
        <Row key={d.id} icon={NotebookPen} title={d.text} meta={`Ägare: ${d.owner} • Deadline: ${d.due}`} />
      ))}
      <div className="text-xs text-slate-500 pt-2">Källcitat finns i auditloggen. Exportera som PDF vid behov.</div>
    </div>
  );
}

function ActionsPanel({ meetingId, compact }: { meetingId: string; compact: boolean }) {
  const items = [
    { id: "A-91", text: "Skapa Planner board", state: "Pågår" },
    { id: "A-92", text: "Skicka post-brief till kund", state: "Ej startad" },
  ];
  return (
    <div className="space-y-3">
      {items.map((a) => (
        <Row key={a.id} icon={ClipboardList} title={a.text} meta={`Status: ${a.state}`} />
      ))}
      <div className="flex items-center gap-2 pt-2">
        <BellDot className="h-4 w-4 text-slate-500" />
        <span className="text-sm text-slate-600">48h-nudges är aktiva för alla öppna åtgärder.</span>
      </div>
    </div>
  );
}

function BriefsPanel({ meetingId, compact }: { meetingId: string; compact: boolean }) {
  return (
    <Tabs defaultValue="pre">
      <TabsList>
        <TabsTrigger value="pre">Pre-brief</TabsTrigger>
        <TabsTrigger value="post">Post-brief</TabsTrigger>
      </TabsList>
      <TabsContent value="pre" className="pt-4">
        <Bullets title="Fokus" items={["Agenda bekräftad","Öppna actions från förra mötet","Risk: leveransslott v.42"]} />
      </TabsContent>
      <TabsContent value="post" className="pt-4">
        <Bullets title="3 beslut" items={["Pilot 15 okt","Offert 29 sep","QA-plan godkänd"]} />
        <Separator className="my-4" />
        <Bullets title="3 risker" items={["Resursbrist QA","Leverantörspris","IT-godkännande"]} />
        <Separator className="my-4" />
        <Bullets title="3 nästa steg" items={["Starta onboarding","Boka kunddemo","Skapa handlingsplan"]} />
      </TabsContent>
    </Tabs>
  );
}

function RegwatchPanel({ meetingId, compact }: { meetingId: string; compact: boolean }) {
  return (
    <div className="space-y-4">
      <Row icon={Layers} title="AI Act – artikel 10 uppdaterad" meta="Gäller 2026-Q2 • Föreslår justering i datakrav" />
      <Row icon={Layers} title="LOU kap 4 – praxis tillagd" meta="Öppnar för mindre insnävande kravformulering" />
      <Card className="border-dashed">
        <CardContent className="pt-6 text-sm text-slate-600">
          Vi visar bara relevanta ändringar. Full historik hittar du under Regwatch → Historik.
        </CardContent>
      </Card>
    </div>
  );
}

function CompliancePanel({ meetingId, compact }: { meetingId: string; compact: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Samtyckesprofil</CardTitle>
          <CardDescription>Välj nivå för detta möte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="consent-bas">Bas</Label>
            <Switch id="consent-bas" checked readOnly />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="consent-plus">Plus</Label>
            <Switch id="consent-plus" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="consent-legal">Juridik</Label>
            <Switch id="consent-legal" />
          </div>
          <Separator />
          <Button variant="outline" className="w-full">Exportera consent receipt</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Retention & radering</CardTitle>
          <CardDescription>Styr hur länge data sparas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select defaultValue="90">
            <SelectTrigger>
              <SelectValue placeholder="Välj retention" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 dagar</SelectItem>
              <SelectItem value="90">90 dagar</SelectItem>
              <SelectItem value="365">365 dagar</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="destructive" className="w-full flex items-center gap-2"><Trash2 className="h-4 w-4" /> Radera allt för detta möte</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ObservabilityPanel({ meetingId, compact }: { meetingId: string; compact: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hälsa</CardTitle>
          <CardDescription>P95-latens & fel</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-1">
          <div>P95 API: 0.92s</div>
          <div>Job queue latens: 3.2s</div>
          <div>Felrate: 0.3%</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kostnad</CardTitle>
          <CardDescription>per möte (estimat)</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-1">
          <div>STT: 12 kr</div>
          <div>LLM: 9 kr</div>
          <div>Lagring: 2 kr</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SLO</CardTitle>
          <CardDescription>mål vs utfall</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-1">
          <div>{"Mål recap < 90s: ✅"}</div>
          <div>{"Mål nudge < 48h: ✅"}</div>
          <div>Missade joins: 0 (7 dagar)</div>
        </CardContent>
      </Card>
    </div>
  );
}

function MonitoringPanel({ meetingId, compact }: { meetingId: string; compact: boolean }) {
  return (
    <div className="space-y-4">
      <MonitoringDashboard />
    </div>
  );
}

function SlashCommandsPanel({ meetingId, compact }: { meetingId: string; compact: boolean }) {
  return (
    <div className="space-y-4">
      <SlashCommandsCard />
    </div>
  );
}

function MagicInvitePanel({ meetingId, compact }: { meetingId: string; compact: boolean }) {
  return (
    <div className="space-y-4">
      <MagicInviteCard />
    </div>
  );
}

function ConsentPanel({ meetingId, compact }: { meetingId: string; compact: boolean }) {
  return (
    <div className="space-y-4">
      <ConsentCard />
    </div>
  );
}

// -------------------- UI atoms ----------------------

function Header({ compact, onCompactChange }: { compact: boolean; onCompactChange: (b: boolean) => void }) {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-slate-500" />
          <span className="font-semibold tracking-tight">Kollegan</span>
          <Badge variant="secondary" className="ml-2">Light</Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
            <Label htmlFor="compact">Kompakt läge</Label>
            <Switch id="compact" checked={compact} onCheckedChange={onCompactChange} />
          </div>
          <Input placeholder="Sök möten, beslut, åtgärder…" className="w-[220px] md:w-[320px]" />
          <Button variant="outline" size="sm" className="gap-2"><Lock className="h-4 w-4" /> Admin</Button>
        </div>
      </div>
    </header>
  );
}

function KpiCard({ icon: Icon, label, value, sub }: { icon: React.ComponentType<any>; label: string; value: string; sub?: string }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="pt-5 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-100"><Icon className="h-5 w-5 text-slate-600" /></div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
          {sub && <div className="text-xs text-slate-500">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ icon: Icon, title, meta }: { icon: React.ComponentType<any>; title: string; meta?: string }) {
  return (
    <div className="group flex items-center justify-between rounded-2xl border border-slate-200 p-3 hover:bg-slate-50 transition">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-100"><Icon className="h-4 w-4 text-slate-600" /></div>
        <div>
          <div className="text-sm font-medium">{title}</div>
          {meta && <div className="text-xs text-slate-500">{meta}</div>}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />
    </div>
  );
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium">{title}</h4>
      <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Snabbåtgärder</CardTitle>
          <CardDescription>Det viktigaste – max tre klick</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Button className="justify-start" variant="default"><CalendarClock className="h-4 w-4 mr-2" /> Bjud in Kollegan</Button>
          <Button className="justify-start" variant="secondary"><BellDot className="h-4 w-4 mr-2" /> Nudga öppna åtgärder</Button>
          <Button className="justify-start" variant="outline"><FileText className="h-4 w-4 mr-2" /> Exportera post-brief</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
          <CardDescription>Lugnt och överskådligt</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-1">
          <div>Agent: Online</div>
          <div>Köjobb: 2 väntar • 6 kör</div>
          <div>Senaste recap: 12:41</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notiser</CardTitle>
          <CardDescription>Endast viktiga händelser</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Row icon={BellDot} title="Post-brief skickad till kund" meta="nyss" />
          <Row icon={BellDot} title="2 åtgärder nudgade" meta="för 1 h sedan" />
        </CardContent>
      </Card>
    </div>
  );
}

// -------------------- Simple config validator ("test cases") ----------------------

function validateSpotlights(cfg: Record<SpotlightKey, SpotlightDef>): string[] {
  const errs: string[] = [];
  (Object.keys(cfg) as SpotlightKey[]).forEach((k) => {
    const s = cfg[k];
    if (!s) errs.push(`Missing spotlight for key ${k}`);
    if (!s.Component) errs.push(`Missing Component for ${k}`);
    if (!s.icon) errs.push(`Missing icon for ${k}`);
    if (!s.title) errs.push(`Missing title for ${k}`);
  });
  return errs;
}