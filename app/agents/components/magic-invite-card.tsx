"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Copy, 
  Check, 
  Mail, 
  Calendar, 
  Users, 
  Sparkles, 
  Link, 
  QrCode,
  MessageSquare,
  Video,
  Shield,
  Clock
} from "lucide-react"
import { toast } from "sonner"

interface MagicInvite {
  id: string
  title: string
  description: string
  platform: "teams" | "zoom" | "google-meet" | "webex"
  inviteUrl: string
  qrCode: string
  expiresAt: string
  usageCount: number
  maxUsage: number
  isActive: boolean
}

const PLATFORM_INFO = {
  teams: {
    name: "Microsoft Teams",
    icon: MessageSquare,
    color: "bg-blue-500",
    description: "Integrera direkt i Teams-möten"
  },
  zoom: {
    name: "Zoom",
    icon: Video,
    color: "bg-blue-600",
    description: "Automatisk join i Zoom-möten"
  },
  "google-meet": {
    name: "Google Meet",
    icon: Calendar,
    color: "bg-green-500",
    description: "Sömlös integration med Google Meet"
  },
  webex: {
    name: "Cisco Webex",
    icon: Shield,
    color: "bg-purple-500",
    description: "Enterprise-säker integration"
  }
}

export function MagicInviteCard() {
  const [invites, setInvites] = useState<MagicInvite[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"create" | "manage" | "templates">("create")

  // Mock data - i en riktig app skulle detta komma från API
  useEffect(() => {
    setInvites([
      {
        id: "invite-1",
        title: "Veckomöte AI-kollega",
        description: "Automatisk AI-kollega för veckomöten",
        platform: "teams",
        inviteUrl: "https://postboxen.ai/invite/veckomote-ai",
        qrCode: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UVI8L3RleHQ+PC9zdmc+",
        expiresAt: "2024-12-31T23:59:59Z",
        usageCount: 15,
        maxUsage: 100,
        isActive: true
      },
      {
        id: "invite-2",
        title: "Projektmöten Zoom",
        description: "AI-kollega för projektmöten i Zoom",
        platform: "zoom",
        inviteUrl: "https://postboxen.ai/invite/projekt-zoom",
        qrCode: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UVI8L3RleHQ+PC9zdmc+",
        expiresAt: "2024-12-31T23:59:59Z",
        usageCount: 8,
        maxUsage: 50,
        isActive: true
      }
    ])
  }, [])

  const copyToClipboard = async (text: string, inviteId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedInvite(inviteId)
      toast.success("Inbjudan kopierad!")
      setTimeout(() => setCopiedInvite(null), 2000)
    } catch (error) {
      toast.error("Kunde inte kopiera inbjudan")
    }
  }

  const createInvite = async (formData: FormData) => {
    setIsCreating(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newInvite: MagicInvite = {
        id: `invite-${Date.now()}`,
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        platform: formData.get("platform") as any,
        inviteUrl: `https://postboxen.ai/invite/${Date.now()}`,
        qrCode: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UVI8L3RleHQ+PC9zdmc+",
        expiresAt: "2024-12-31T23:59:59Z",
        usageCount: 0,
        maxUsage: parseInt(formData.get("maxUsage") as string) || 100,
        isActive: true
      }
      
      setInvites(prev => [newInvite, ...prev])
      toast.success("Magisk inbjudan skapad!")
    } catch (error) {
      toast.error("Kunde inte skapa inbjudan")
    } finally {
      setIsCreating(false)
    }
  }

  const toggleInviteStatus = (inviteId: string) => {
    setInvites(prev => prev.map(invite => 
      invite.id === inviteId 
        ? { ...invite, isActive: !invite.isActive }
        : invite
    ))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Magisk inbjudan
        </CardTitle>
        <CardDescription>
          Skapa unika inbjudningar för AI-kollega som användare kan dela med kollegor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Skapa</TabsTrigger>
            <TabsTrigger value="manage">Hantera</TabsTrigger>
            <TabsTrigger value="templates">Mallar</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <form action={createInvite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titel</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    placeholder="t.ex. Veckomöte AI-kollega" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">Mötesplattform</Label>
                  <Select name="platform" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj plattform" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLATFORM_INFO).map(([key, info]) => {
                        const Icon = info.icon
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {info.name}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivning</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="Beskriv vad AI-kollegan kommer att göra i dessa möten..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUsage">Max antal användningar</Label>
                  <Input 
                    id="maxUsage" 
                    name="maxUsage" 
                    type="number" 
                    min="1" 
                    max="1000"
                    defaultValue="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Går ut</Label>
                  <Input 
                    id="expiresAt" 
                    name="expiresAt" 
                    type="date" 
                    defaultValue="2024-12-31"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? "Skapar..." : "Skapa magisk inbjudan"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <div className="space-y-4">
              {invites.map((invite) => {
                const platformInfo = PLATFORM_INFO[invite.platform]
                const Icon = platformInfo.icon
                
                return (
                  <div key={invite.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${platformInfo.color} text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{invite.title}</h3>
                          <p className="text-sm text-muted-foreground">{invite.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={invite.isActive ? "default" : "secondary"}>
                          {invite.isActive ? "Aktiv" : "Inaktiv"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleInviteStatus(invite.id)}
                        >
                          {invite.isActive ? "Deaktivera" : "Aktivera"}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Inbjudningslänk</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={invite.inviteUrl} 
                            readOnly 
                            className="text-xs"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(invite.inviteUrl, invite.id)}
                          >
                            {copiedInvite === invite.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">QR-kod</Label>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full">
                              <QrCode className="h-4 w-4 mr-2" />
                              Visa QR
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>QR-kod för {invite.title}</DialogTitle>
                              <DialogDescription>
                                Skanna med mobilkamera för att dela inbjudan
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-center">
                              <img 
                                src={invite.qrCode} 
                                alt="QR Code" 
                                className="w-48 h-48"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Användning</Label>
                        <div className="text-sm">
                          <div className="flex justify-between">
                            <span>{invite.usageCount}</span>
                            <span className="text-muted-foreground">/ {invite.maxUsage}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 mt-1">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(invite.usageCount / invite.maxUsage) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Går ut: {new Date(invite.expiresAt).toLocaleDateString("sv-SE")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {platformInfo.name}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "Veckomöte",
                  description: "AI-kollega för regelbundna veckomöten",
                  platform: "teams" as const,
                  features: ["Automatisk dokumentation", "Beslutskort", "Åtgärdsuppföljning"]
                },
                {
                  title: "Projektmöte",
                  description: "Specialiserad för projektmöten",
                  platform: "zoom" as const,
                  features: ["Stakeholder-analys", "Riskhantering", "Timeline-tracking"]
                },
                {
                  title: "Retrospektiv",
                  description: "AI-kollega för retrospektiva möten",
                  platform: "google-meet" as const,
                  features: ["Sentiment-analys", "Förbättringsförslag", "Team-insikter"]
                },
                {
                  title: "Kundmöte",
                  description: "Professionell AI-kollega för kundmöten",
                  platform: "webex" as const,
                  features: ["Kundinsikter", "Följduppgifter", "Rapporter"]
                }
              ].map((template, index) => {
                const platformInfo = PLATFORM_INFO[template.platform]
                const Icon = platformInfo.icon
                
                return (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${platformInfo.color} text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.title}</CardTitle>
                          <CardDescription className="text-sm">{template.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Funktioner:</Label>
                        <ul className="text-xs space-y-1">
                          {template.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={() => {
                          // Mock template application
                          toast.success(`Mall "${template.title}" applicerad!`)
                        }}
                      >
                        Använd mall
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
