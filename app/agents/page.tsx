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
  Trash2,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MonitoringDashboard } from "./components/monitoring-dashboard";
import { SlashCommandsCard } from "./components/slash-commands-card";
import { MagicInviteCard } from "./components/magic-invite-card";
import { ConsentCard } from "./components/consent-card";
import { CommandPalette } from "./components/command-palette";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";

// Simple placeholder components
const KPICard = ({ title, value, change, icon: Icon, trend }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{change}</p>
    </CardContent>
  </Card>
);

const MeetingOverview = () => (
  <Card>
    <CardHeader>
      <CardTitle>Mötesöversikt</CardTitle>
      <CardDescription>Senaste möten och kommande</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Inga möten hittades</p>
    </CardContent>
  </Card>
);

const DecisionCards = () => (
  <Card>
    <CardHeader>
      <CardTitle>Beslut</CardTitle>
      <CardDescription>Senaste beslut från möten</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Inga beslut hittades</p>
    </CardContent>
  </Card>
);

const Briefs = () => (
  <Card>
    <CardHeader>
      <CardTitle>Briefs</CardTitle>
      <CardDescription>För-brief 30 min före och post-brief efter mötet.</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Inga briefs hittades</p>
    </CardContent>
  </Card>
);

const Regwatch = () => (
  <Card>
    <CardHeader>
      <CardTitle>Regeländringar</CardTitle>
      <CardDescription>Senaste ändringar i regelverk</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Inga ändringar hittades</p>
    </CardContent>
  </Card>
);

const Retention = () => (
  <Card>
    <CardHeader>
      <CardTitle>Retention</CardTitle>
      <CardDescription>Datahantering och lagring</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Inga retention-policies hittades</p>
    </CardContent>
  </Card>
);

const QueueDashboard = () => (
  <Card>
    <CardHeader>
      <CardTitle>Queue Dashboard</CardTitle>
      <CardDescription>Jobbköer och status</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Inga jobb hittades</p>
    </CardContent>
  </Card>
);

const Nudging = () => (
  <Card>
    <CardHeader>
      <CardTitle>Nudging</CardTitle>
      <CardDescription>Påminnelser och uppföljning</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Inga nudges hittades</p>
    </CardContent>
  </Card>
);

const Observability = () => (
  <Card>
    <CardHeader>
      <CardTitle>Observability</CardTitle>
      <CardDescription>Systemövervakning och metrics</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="text-sm">Mål recap &lt; 90s: ✅</div>
        <div className="text-sm">Mål nudge &lt; 48h: ✅</div>
        <div className="text-sm">Error rate: 0.02%</div>
        <div className="text-sm">Uptime: 99.9%</div>
      </div>
    </CardContent>
  </Card>
);

// -------------------- Types ----------------------

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
  title: string;
  icon: React.ComponentType<any>;
  Component: React.ComponentType<any>;
}

// -------------------- Spotlight Config ----------------------

const SPOTLIGHTS: Record<SpotlightKey, SpotlightDef> = {
  meetings: {
    title: "Möten",
    icon: Calendar,
    Component: MeetingOverview,
  },
  decisions: {
    title: "Beslut",
    icon: CheckCircle,
    Component: DecisionCards,
  },
  actions: {
    title: "Åtgärder",
    icon: Clock,
    Component: () => <div>Actions Component</div>,
  },
  briefs: {
    title: "Briefs",
    icon: FileText,
    Component: Briefs,
  },
  regwatch: {
    title: "Regwatch",
    icon: ShieldCheck,
    Component: Regwatch,
  },
  compliance: {
    title: "Compliance",
    icon: Lock,
    Component: Retention,
  },
  observability: {
    title: "Observability",
    icon: Gauge,
    Component: Observability,
  },
  monitoring: {
    title: "Monitoring",
    icon: LineChart,
    Component: MonitoringDashboard,
  },
  "slash-commands": {
    title: "Slash Commands",
    icon: Terminal,
    Component: SlashCommandsCard,
  },
  "magic-invite": {
    title: "Magic Invite",
    icon: Sparkles,
    Component: MagicInviteCard,
  },
  consent: {
    title: "Consent",
    icon: ShieldCheck,
    Component: ConsentCard,
  },
};

// -------------------- UI Components ----------------------

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
          <div className="flex items-center gap-2 text-sm">
            <BellDot className="h-4 w-4 text-green-600" />
            <span>Post-brief skickad till kund</span>
            <span className="text-slate-500 text-xs">nyss</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BellDot className="h-4 w-4 text-blue-600" />
            <span>2 åtgärder nudgade</span>
            <span className="text-slate-500 text-xs">för 1 h sedan</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AgentsPage() {
  const { settings, isLoaded, updateSpotlight, updateCompact } = useDashboardSettings();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const spotlight = settings.spotlight;
  const compact = settings.compact;

  const handleSpotlightChange = (newSpotlight: SpotlightKey) => {
    updateSpotlight(newSpotlight);
  };

  const handleCompactToggle = (checked: boolean) => {
    updateCompact(checked);
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  const spotlightDef = SPOTLIGHTS[spotlight];
  const SpotlightComponent = spotlightDef.Component;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI-kollega</h1>
            <p className="text-slate-600">Din intelligenta mötesassistent</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="compact-mode" className="text-sm">Kompakt läge</Label>
              <Switch
                id="compact-mode"
                checked={compact}
                onCheckedChange={handleCompactToggle}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommandPaletteOpen(true)}
            >
              <Command className="h-4 w-4 mr-2" />
              ⌘K
            </Button>
          </div>
        </div>
      </div>

      {/* Spotlight Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 py-2">
        <Tabs value={spotlight} onValueChange={handleSpotlightChange}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-11">
            {Object.entries(SPOTLIGHTS).map(([key, def]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                <def.icon className="h-4 w-4 mr-1" />
                {def.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <KPICard
              title="Möten"
              value="12"
              change="+2 denna vecka"
              icon={Calendar}
              trend="up"
            />
            <KPICard
              title="Beslut"
              value="8"
              change="+1 idag"
              icon={CheckCircle}
              trend="up"
            />
            <KPICard
              title="Åtgärder"
              value="15"
              change="3 öppna"
              icon={Clock}
              trend="neutral"
            />
            {!compact && (
              <KPICard
                title="Mötesdisciplin"
                value="87%"
                change="+5% denna månad"
                icon={Users}
                trend="up"
              />
            )}
          </div>

          {/* Spotlight Content */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <spotlightDef.icon className="h-5 w-5 text-slate-600" />
              <h2 className="text-xl font-semibold text-slate-900">Spotlight</h2>
            </div>
            <SpotlightComponent />
          </div>

          {/* Quick Actions */}
          <QuickActions />

          {/* Command Palette */}
          <CommandPalette 
            open={commandPaletteOpen}
            onOpenChange={setCommandPaletteOpen}
            onSelectSpotlight={handleSpotlightChange}
            currentSpotlight={spotlight}
          />
        </div>
      </div>
    </main>
  );
}