"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, Terminal, MessageSquare, Calendar, FileText, Shield, Video } from "lucide-react"
import { toast } from "sonner"

interface SlashCommand {
  command: string
  description: string
  usage: string
  actions: Record<string, string>
  platform: "teams" | "zoom" | "google-meet" | "webex"
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: "/postboxen",
    description: "Huvudkommando för Postboxen AI-kollega",
    usage: "/postboxen [action] [options]",
    actions: {
      "schedule": "Schemalägg ett möte med AI-kollega",
      "status": "Kontrollera status för pågående möten",
      "summary": "Hämta sammanfattning av senaste möte",
      "help": "Visa hjälp och tillgängliga kommandon",
    },
    platform: "teams"
  },
  {
    command: "/meeting",
    description: "Snabbkommando för möteshantering",
    usage: "/meeting [action]",
    actions: {
      "start": "Starta AI-kollega för pågående möte",
      "stop": "Stoppa AI-kollega",
      "summary": "Hämta sammanfattning",
      "decisions": "Visa beslut från mötet",
      "actions": "Visa åtgärder från mötet",
    },
    platform: "teams"
  },
  {
    command: "/brief",
    description: "Hantera briefing-funktioner",
    usage: "/brief [action]",
    actions: {
      "pre": "Generera pre-brief för kommande möte",
      "post": "Generera post-brief för avslutat möte",
      "status": "Kontrollera briefing-status",
    },
    platform: "teams"
  },
  {
    command: "/regwatch",
    description: "Regelverksövervakning",
    usage: "/regwatch [action]",
    actions: {
      "check": "Kontrollera senaste regelverksändringar",
      "alerts": "Visa aktiva varningar",
      "subscribe": "Prenumerera på regelverksuppdateringar",
    },
    platform: "teams"
  }
]

const PLATFORM_INFO = {
  teams: {
    name: "Microsoft Teams",
    icon: MessageSquare,
    color: "bg-blue-500",
    setupUrl: "https://teams.microsoft.com/apps",
    webhookUrl: "/api/integrations/teams/slash-commands"
  },
  zoom: {
    name: "Zoom",
    icon: Video,
    color: "bg-blue-600",
    setupUrl: "https://marketplace.zoom.us/apps",
    webhookUrl: "/api/integrations/zoom/slash-commands"
  },
  "google-meet": {
    name: "Google Meet",
    icon: Calendar,
    color: "bg-green-500",
    setupUrl: "https://workspace.google.com/marketplace",
    webhookUrl: "/api/integrations/google-meet/slash-commands"
  },
  webex: {
    name: "Cisco Webex",
    icon: Shield,
    color: "bg-purple-500",
    setupUrl: "https://apphub.webex.com/apps",
    webhookUrl: "/api/integrations/webex/slash-commands"
  }
}

export function SlashCommandsCard() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)
  const [activePlatform, setActivePlatform] = useState<keyof typeof PLATFORM_INFO>("teams")

  const copyToClipboard = async (text: string, command: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCommand(command)
      toast.success("Kommando kopierat!")
      setTimeout(() => setCopiedCommand(null), 2000)
    } catch (error) {
      toast.error("Kunde inte kopiera kommando")
    }
  }

  const getPlatformCommands = (platform: keyof typeof PLATFORM_INFO) => {
    return SLASH_COMMANDS.filter(cmd => cmd.platform === platform)
  }

  const currentCommands = getPlatformCommands(activePlatform)
  const platformInfo = PLATFORM_INFO[activePlatform]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          Slash-kommandon
        </CardTitle>
        <CardDescription>
          Power user-funktioner för snabb åtkomst till AI-kollega direkt i mötesplattformarna
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Selection */}
        <Tabs value={activePlatform} onValueChange={(value) => setActivePlatform(value as keyof typeof PLATFORM_INFO)}>
          <TabsList className="grid w-full grid-cols-4">
            {Object.entries(PLATFORM_INFO).map(([key, info]) => {
              const Icon = info.icon
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{info.name}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value={activePlatform} className="space-y-4">
            {/* Platform Info */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${platformInfo.color} text-white`}>
                  <platformInfo.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{platformInfo.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Webhook URL: <code className="text-xs bg-background px-1 rounded">{platformInfo.webhookUrl}</code>
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={platformInfo.setupUrl} target="_blank" rel="noopener noreferrer">
                  Konfigurera
                </a>
              </Button>
            </div>

            {/* Commands List */}
            <div className="space-y-4">
              {currentCommands.map((command) => (
                <div key={command.command} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {command.command}
                      </code>
                      <Badge variant="secondary">Power User</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(command.command, command.command)}
                    >
                      {copiedCommand === command.command ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{command.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Användning:</span>
                      <code className="text-xs bg-muted px-1 rounded">{command.usage}</code>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Åtgärder:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {Object.entries(command.actions).map(([action, description]) => (
                          <div key={action} className="flex items-center gap-2 text-xs">
                            <code className="bg-muted px-1 rounded">{action}</code>
                            <span className="text-muted-foreground">{description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Examples */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Exempel</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    /postboxen schedule "Projektmöte" "2024-01-15 14:00" "15:30"
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('/postboxen schedule "Projektmöte" "2024-01-15 14:00" "15:30"', "example1")}
                  >
                    {copiedCommand === "example1" ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    /meeting start
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("/meeting start", "example2")}
                  >
                    {copiedCommand === "example2" ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    /brief pre
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("/brief pre", "example3")}
                  >
                    {copiedCommand === "example3" ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    /regwatch check
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("/regwatch check", "example4")}
                  >
                    {copiedCommand === "example4" ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Setup Instructions */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
                Konfigurationsinstruktioner
              </h4>
              <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>Gå till {platformInfo.name} App Store/Marketplace</li>
                <li>Skapa en ny app eller bot</li>
                <li>Konfigurera slash commands med webhook URL: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{platformInfo.webhookUrl}</code></li>
                <li>Aktivera appen för din organisation</li>
                <li>Testa kommandona i {platformInfo.name}</li>
              </ol>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
