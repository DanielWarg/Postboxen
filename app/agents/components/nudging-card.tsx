"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Bell, Clock, Users, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface NudgingCardProps {
  // Props removed to fix Next.js 15 Client Component issue
}

export function NudgingCard({}: NudgingCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [nudgingType, setNudgingType] = useState<string>("follow_up")
  const [meetingId, setMeetingId] = useState<string>("")
  const [userId, setUserId] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  const [delayHours, setDelayHours] = useState<string>("24")
  const [customMessage, setCustomMessage] = useState<string>("")

  const nudgingTypes = [
    { value: "follow_up", label: "Följ upp", description: "Påminnelse om mötesuppföljning" },
    { value: "deadline_reminder", label: "Deadline", description: "Påminnelse om kommande deadline" },
    { value: "action_required", label: "Åtgärd krävs", description: "Påminnelse om väntande åtgärder" },
    { value: "meeting_prep", label: "Mötesförberedelse", description: "Förberedelse inför kommande möte" },
  ]

  const handleScheduleNudging = async () => {
    if (!meetingId || !userId || !userEmail) {
      toast.error("Fyll i alla obligatoriska fält")
      return
    }

    setIsLoading(true)
    
    try {
      const delayMs = parseInt(delayHours) * 60 * 60 * 1000 // Convert hours to milliseconds
      
      const response = await fetch("/api/agents/nudging", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meetingId,
          userId,
          userEmail,
          nudgingType,
          delayMs,
          config: {
            customMessage: customMessage || undefined,
            priority: "medium",
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to schedule nudging")
      }

      const result = await response.json()
      toast.success("Nudging schemalagt!", {
        description: `Jobb ID: ${result.jobId}. Skickas om ${delayHours} timmar.`,
      })
      
      // Callback removed for Next.js 15 compatibility
      
      // Reset form
      setMeetingId("")
      setUserId("")
      setUserEmail("")
      setCustomMessage("")

    } catch (error) {
      toast.error("Kunde inte schemalägga nudging", {
        description: (error as Error).message,
      })
      console.error("Nudging error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getNudgingIcon = (type: string) => {
    switch (type) {
      case "follow_up": return <CheckCircle className="h-4 w-4" />
      case "deadline_reminder": return <Clock className="h-4 w-4" />
      case "action_required": return <AlertCircle className="h-4 w-4" />
      case "meeting_prep": return <Users className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getNudgingColor = (type: string) => {
    switch (type) {
      case "follow_up": return "bg-green-100 text-green-800"
      case "deadline_reminder": return "bg-orange-100 text-orange-800"
      case "action_required": return "bg-red-100 text-red-800"
      case "meeting_prep": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg text-purple-900">Nudging & Notifications</CardTitle>
        </div>
        <CardDescription className="text-purple-700">
          Schemalägg påminnelser och följupp för möten
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Nudging Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="nudging-type">Typ av nudging</Label>
          <Select value={nudgingType} onValueChange={setNudgingType}>
            <SelectTrigger>
              <SelectValue placeholder="Välj typ av nudging" />
            </SelectTrigger>
            <SelectContent>
              {nudgingTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    {getNudgingIcon(type.value)}
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Meeting Information */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="meeting-id">Mötes-ID *</Label>
            <Input
              id="meeting-id"
              placeholder="meeting-123"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-id">Användar-ID *</Label>
            <Input
              id="user-id"
              placeholder="user-456"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-email">E-postadress *</Label>
          <Input
            id="user-email"
            type="email"
            placeholder="user@example.com"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
        </div>

        {/* Timing */}
        <div className="space-y-2">
          <Label htmlFor="delay-hours">Fördröjning (timmar)</Label>
          <Input
            id="delay-hours"
            type="number"
            min="0"
            max="168"
            placeholder="24"
            value={delayHours}
            onChange={(e) => setDelayHours(e.target.value)}
          />
        </div>

        {/* Custom Message */}
        <div className="space-y-2">
          <Label htmlFor="custom-message">Anpassat meddelande (valfritt)</Label>
          <Textarea
            id="custom-message"
            placeholder="Lägg till ett personligt meddelande..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={3}
          />
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={getNudgingColor(nudgingType)}>
              {getNudgingIcon(nudgingType)}
              {nudgingTypes.find(t => t.value === nudgingType)?.label}
            </Badge>
            <span className="text-sm text-purple-600">
              Skickas om {delayHours} timmar
            </span>
          </div>
          <p className="text-sm text-purple-700">
            {nudgingTypes.find(t => t.value === nudgingType)?.description}
          </p>
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleScheduleNudging}
          disabled={isLoading || !meetingId || !userId || !userEmail}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? "Schemalägger..." : "Schemalägg nudging"}
        </Button>

        <div className="text-xs text-purple-600">
          <strong>Funktioner:</strong> E-post, Teams, Slack, Push-notifikationer
        </div>
      </CardContent>
    </Card>
  )
}
