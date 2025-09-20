"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Shield, CheckCircle, Clock, Globe, FileText, Monitor } from "lucide-react"
import { toast } from "sonner"

interface ConsentCardProps {
  meetingId?: string
  userEmail?: string
  currentProfile?: "bas" | "plus" | "juridik"
  onConsentChange?: (profile: "bas" | "plus" | "juridik") => void
}

export function ConsentCard({ meetingId, userEmail, currentProfile, onConsentChange }: ConsentCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<"bas" | "plus" | "juridik">(currentProfile || "bas")

  const profiles = {
    bas: {
      name: "Bas",
      description: "Grundläggande mötesdata",
      icon: Shield,
      color: "bg-green-100 text-green-800",
      features: ["Ljudinspelning", "Chattmeddelanden"],
      retentionDays: 30,
      dataResidency: "EU",
      scope: ["audio", "chat"]
    },
    plus: {
      name: "Plus", 
      description: "Utökad mötesdata",
      icon: CheckCircle,
      color: "bg-blue-100 text-blue-800",
      features: ["Ljudinspelning", "Chattmeddelanden", "Dokumentdelning"],
      retentionDays: 90,
      dataResidency: "EU",
      scope: ["audio", "chat", "documents"]
    },
    juridik: {
      name: "Juridik",
      description: "Fullständig mötesdata",
      icon: FileText,
      color: "bg-purple-100 text-purple-800",
      features: ["Ljudinspelning", "Chattmeddelanden", "Dokumentdelning", "Skärmdelning"],
      retentionDays: 365,
      dataResidency: "Kund",
      scope: ["audio", "chat", "documents", "screen"]
    }
  }

  const handleConsentChange = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/agents/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_consent",
          meetingId,
          userEmail,
          profile: selectedProfile,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Okänt fel")
      }

      toast.success(data.message)
      onConsentChange?.(selectedProfile)
      setIsOpen(false)

    } catch (error) {
      console.error("Consent change error:", error)
      toast.error(error instanceof Error ? error.message : "Okänt fel")
    } finally {
      setIsLoading(false)
    }
  }

  const currentProfileInfo = currentProfile ? profiles[currentProfile] : null

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-900">
              Samtyckescenter
            </CardTitle>
          </div>
          {currentProfileInfo && (
            <Badge className={currentProfileInfo.color}>
              {currentProfileInfo.name}
            </Badge>
          )}
        </div>
        <CardDescription className="text-blue-700">
          {meetingId 
            ? `Hantera samtycke för möte ${meetingId}`
            : `Hantera samtyckesprofil för ${userEmail}`
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {currentProfileInfo && (
          <div className="rounded-md bg-white p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <currentProfileInfo.icon className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Aktuell profil: {currentProfileInfo.name}</span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>Retention: {currentProfileInfo.retentionDays} dagar</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3" />
                <span>Databoende: {currentProfileInfo.dataResidency}</span>
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="h-3 w-3" />
                <span>Omfattning: {currentProfileInfo.features.join(", ")}</span>
              </div>
            </div>
          </div>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Ändra samtyckesprofil
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-600">
                <Shield className="h-5 w-5" />
                Välj samtyckesprofil
              </DialogTitle>
              <DialogDescription>
                Välj vilken typ av data som ska samlas in och hur länge den ska sparas.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <RadioGroup value={selectedProfile} onValueChange={(value) => setSelectedProfile(value as "bas" | "plus" | "juridik")}>
                {Object.entries(profiles).map(([key, profile]) => {
                  const IconComponent = profile.icon
                  return (
                    <div key={key} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value={key} id={key} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={key} className="flex items-center gap-2 cursor-pointer">
                          <IconComponent className="h-4 w-4" />
                          <span className="font-medium">{profile.name}</span>
                          <Badge className={profile.color} variant="outline">
                            {profile.retentionDays} dagar
                          </Badge>
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">{profile.description}</p>
                        <div className="mt-2 space-y-1">
                          <div className="text-xs text-gray-500">
                            <strong>Omfattning:</strong> {profile.features.join(", ")}
                          </div>
                          <div className="text-xs text-gray-500">
                            <strong>Databoende:</strong> {profile.dataResidency}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </RadioGroup>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>GDPR-compliance</AlertTitle>
                <AlertDescription className="text-sm">
                  Alla profiler följer GDPR-regler. Data sparas endast så länge som nödvändigt 
                  och kan raderas på begäran. En audit-logg skapas för alla ändringar.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Avbryt
              </Button>
              <Button 
                onClick={handleConsentChange}
                disabled={isLoading || selectedProfile === currentProfile}
              >
                {isLoading ? "Uppdaterar..." : "Uppdatera samtycke"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
