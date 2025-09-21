"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Checkbox 
} from "@/components/ui/checkbox"
import { 
  Label 
} from "@/components/ui/label"
import { 
  Shield, 
  ShieldCheck, 
  Clock, 
  Globe, 
  FileText, 
  Mic, 
  MessageSquare, 
  Monitor,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react"
import { toast } from "sonner"

interface ConsentProfile {
  id: string
  name: string
  description: string
  scope: string[]
  retentionDays: number
  dataResidency: string
  icon: any
  color: string
  features: string[]
  limitations: string[]
}

interface ConsentRecord {
  id: string
  meetingId: string
  profile: string
  scope: string[]
  retentionDays: number
  dataResidency: string
  acceptedAt: string
  expiresAt: string
  isActive: boolean
  usageCount: number
}

const CONSENT_PROFILES: ConsentProfile[] = [
  {
    id: "bas",
    name: "Bas",
    description: "Grundläggande mötesdokumentation",
    scope: ["audio", "chat"],
    retentionDays: 30,
    dataResidency: "eu",
    icon: Mic,
    color: "bg-green-500",
    features: [
      "Ljudinspelning och transkription",
      "Chat-meddelanden",
      "Grundläggande sammanfattning",
      "30 dagars lagring"
    ],
    limitations: [
      "Ingen skärminspelning",
      "Ingen dokumentanalys",
      "Begränsad AI-analys"
    ]
  },
  {
    id: "plus",
    name: "Plus",
    description: "Utökad mötesanalys och dokumentation",
    scope: ["audio", "chat", "documents"],
    retentionDays: 90,
    dataResidency: "eu",
    icon: FileText,
    color: "bg-blue-500",
    features: [
      "Allt från Bas-profilen",
      "Dokumentanalys och diff",
      "Avancerad AI-analys",
      "Stakeholder-insikter",
      "90 dagars lagring"
    ],
    limitations: [
      "Ingen skärminspelning",
      "Begränsad regelverksövervakning"
    ]
  },
  {
    id: "juridik",
    name: "Juridik",
    description: "Fullständig compliance och juridisk dokumentation",
    scope: ["audio", "chat", "documents", "screen"],
    retentionDays: 180,
    dataResidency: "customer",
    icon: ShieldCheck,
    color: "bg-purple-500",
    features: [
      "Allt från Plus-profilen",
      "Skärminspelning",
      "Regelverksövervakning",
      "Juridiska referenser",
      "Audit-spårning",
      "180 dagars lagring",
      "Kundstyrd datalagring"
    ],
    limitations: [
      "Högre kostnad",
      "Kräver juridisk granskning"
    ]
  }
]

export function ConsentCard() {
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([])
  const [selectedProfile, setSelectedProfile] = useState<string>("bas")
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "profiles" | "management" | "audit">("overview")

  // Mock data - i en riktig app skulle detta komma från API
  useEffect(() => {
    setConsentRecords([
      {
        id: "consent-1",
        meetingId: "meeting-123",
        profile: "plus",
        scope: ["audio", "chat", "documents"],
        retentionDays: 90,
        dataResidency: "eu",
        acceptedAt: "2024-01-15T10:00:00Z",
        expiresAt: "2024-04-15T10:00:00Z",
        isActive: true,
        usageCount: 5
      },
      {
        id: "consent-2",
        meetingId: "meeting-456",
        profile: "juridik",
        scope: ["audio", "chat", "documents", "screen"],
        retentionDays: 180,
        dataResidency: "customer",
        acceptedAt: "2024-01-10T14:30:00Z",
        expiresAt: "2024-07-10T14:30:00Z",
        isActive: true,
        usageCount: 2
      }
    ])
  }, [])

  const updateConsent = async (meetingId: string, profile: string) => {
    setIsUpdating(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const profileData = CONSENT_PROFILES.find(p => p.id === profile)
      if (!profileData) return

      const newConsent: ConsentRecord = {
        id: `consent-${Date.now()}`,
        meetingId,
        profile,
        scope: profileData.scope,
        retentionDays: profileData.retentionDays,
        dataResidency: profileData.dataResidency,
        acceptedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + profileData.retentionDays * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        usageCount: 0
      }
      
      setConsentRecords(prev => [newConsent, ...prev])
      toast.success(`Samtycke uppdaterat till ${profileData.name}-profil`)
    } catch (error) {
      toast.error("Kunde inte uppdatera samtycke")
    } finally {
      setIsUpdating(false)
    }
  }

  const revokeConsent = async (consentId: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setConsentRecords(prev => prev.map(record => 
        record.id === consentId 
          ? { ...record, isActive: false }
          : record
      ))
      toast.success("Samtycke återkallat")
    } catch (error) {
      toast.error("Kunde inte återkalla samtycke")
    }
  }

  const exportConsentData = async (consentId: string) => {
    try {
      const consent = consentRecords.find(c => c.id === consentId)
      if (!consent) return

      const exportData = {
        consentId: consent.id,
        meetingId: consent.meetingId,
        profile: consent.profile,
        scope: consent.scope,
        retentionDays: consent.retentionDays,
        dataResidency: consent.dataResidency,
        acceptedAt: consent.acceptedAt,
        expiresAt: consent.expiresAt,
        exportedAt: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `consent-${consent.meetingId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success("Samtyckesdata exporterad")
    } catch (error) {
      toast.error("Kunde inte exportera data")
    }
  }

  const getProfileInfo = (profileId: string) => {
    return CONSENT_PROFILES.find(p => p.id === profileId)
  }

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case "audio": return Mic
      case "chat": return MessageSquare
      case "documents": return FileText
      case "screen": return Monitor
      default: return Info
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Samtyckeshantering
        </CardTitle>
        <CardDescription>
          GDPR-compliant samtyckeshantering för mötesdokumentation och AI-analys
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Översikt</TabsTrigger>
            <TabsTrigger value="profiles">Profiler</TabsTrigger>
            <TabsTrigger value="management">Hantera</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Aktiva samtycken</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {consentRecords.filter(c => c.isActive).length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Utgår snart</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {consentRecords.filter(c => 
                      c.isActive && 
                      new Date(c.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    ).length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">EU-databoende</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {consentRecords.filter(c => c.dataResidency === "eu").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Senaste samtycken</h3>
              {consentRecords.slice(0, 3).map((record) => {
                const profile = getProfileInfo(record.profile)
                const Icon = profile?.icon || Shield
                
                return (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${profile?.color || 'bg-gray-500'} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{profile?.name || record.profile}</div>
                        <div className="text-sm text-muted-foreground">
                          Möte: {record.meetingId}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={record.isActive ? "default" : "secondary"}>
                        {record.isActive ? "Aktiv" : "Inaktiv"}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {new Date(record.acceptedAt).toLocaleDateString("sv-SE")}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="profiles" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CONSENT_PROFILES.map((profile) => {
                const Icon = profile.icon
                
                return (
                  <Card key={profile.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${profile.color} text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{profile.name}</CardTitle>
                          <CardDescription className="text-sm">{profile.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Omfattning:</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {profile.scope.map((scope) => {
                            const ScopeIcon = getScopeIcon(scope)
                            return (
                              <Badge key={scope} variant="outline" className="text-xs">
                                <ScopeIcon className="h-3 w-3 mr-1" />
                                {scope}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Lagring:</span>
                          <span>{profile.retentionDays} dagar</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Databoende:</span>
                          <span className="capitalize">{profile.dataResidency}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Funktioner:</Label>
                        <ul className="text-xs space-y-1">
                          {profile.features.slice(0, 3).map((feature, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              {feature}
                            </li>
                          ))}
                          {profile.features.length > 3 && (
                            <li className="text-muted-foreground">
                              +{profile.features.length - 3} fler...
                            </li>
                          )}
                        </ul>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setSelectedProfile(profile.id)}
                      >
                        Välj profil
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="management" className="space-y-4">
            <div className="space-y-4">
              {consentRecords.map((record) => {
                const profile = getProfileInfo(record.profile)
                const Icon = profile?.icon || Shield
                
                return (
                  <div key={record.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${profile?.color || 'bg-gray-500'} text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{profile?.name || record.profile}</h3>
                          <p className="text-sm text-muted-foreground">
                            Möte: {record.meetingId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={record.isActive ? "default" : "secondary"}>
                          {record.isActive ? "Aktiv" : "Inaktiv"}
                        </Badge>
                        <Select 
                          value={record.profile} 
                          onValueChange={(value) => updateConsent(record.meetingId, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONSENT_PROFILES.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Omfattning</Label>
                        <div className="flex flex-wrap gap-1">
                          {record.scope.map((scope) => {
                            const ScopeIcon = getScopeIcon(scope)
                            return (
                              <Badge key={scope} variant="outline" className="text-xs">
                                <ScopeIcon className="h-3 w-3 mr-1" />
                                {scope}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Lagring</Label>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {record.retentionDays} dagar
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Utgår: {new Date(record.expiresAt).toLocaleDateString("sv-SE")}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Databoende</Label>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {record.dataResidency}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Åtgärder</Label>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportConsentData(record.id)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => revokeConsent(record.id)}
                            disabled={!record.isActive}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Audit-log</h3>
              <div className="space-y-2">
                {consentRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Samtycke accepterat</span>
                      </div>
                      <span className="text-muted-foreground">
                        {record.profile}-profil för möte {record.meetingId}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(record.acceptedAt).toLocaleString("sv-SE")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}