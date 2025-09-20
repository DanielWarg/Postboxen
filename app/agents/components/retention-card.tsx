"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, AlertTriangle, Download, Clock } from "lucide-react"
import { toast } from "sonner"

interface RetentionCardProps {
  meetingId?: string
  userEmail?: string
  profile?: "bas" | "plus" | "juridik"
  onRetentionComplete?: (result: any) => void
}

export function RetentionCard({ meetingId, userEmail, profile, onRetentionComplete }: RetentionCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [confirmationText, setConfirmationText] = useState("")
  const [result, setResult] = useState<any>(null)

  const isDeleteAll = !meetingId && userEmail
  const confirmationRequired = isDeleteAll ? "RADERA ALLT" : "RADERA MÖTE"

  const handleRetention = async () => {
    if (confirmationText !== confirmationRequired) {
      toast.error("Bekräftelse-texten stämmer inte")
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch("/api/agents/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isDeleteAll ? "delete_all" : "execute_retention",
          ...(isDeleteAll ? { userEmail } : { meetingId, profile }),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Okänt fel")
      }

      setResult(data.data)
      toast.success(data.message)
      onRetentionComplete?.(data.data)
      setIsOpen(false)
      setConfirmationText("")

    } catch (error) {
      console.error("Retention error:", error)
      toast.error(error instanceof Error ? error.message : "Okänt fel")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadConsentReceipt = () => {
    if (!result?.consentReceipt) return
    
    const blob = new Blob([result.consentReceipt], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `consent-receipt-${isDeleteAll ? userEmail : meetingId}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getRetentionInfo = () => {
    if (!profile) return null
    
    const profiles = {
      bas: { days: 30, residency: "EU", color: "bg-green-100 text-green-800" },
      plus: { days: 90, residency: "EU", color: "bg-blue-100 text-blue-800" },
      juridik: { days: 365, residency: "Kund", color: "bg-purple-100 text-purple-800" },
    }
    
    return profiles[profile]
  }

  const retentionInfo = getRetentionInfo()

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <CardTitle className="text-lg text-red-900">
              {isDeleteAll ? "Radera all data" : "Retention & Radera"}
            </CardTitle>
          </div>
          {retentionInfo && (
            <Badge className={retentionInfo.color}>
              {retentionInfo.days} dagar
            </Badge>
          )}
        </div>
        <CardDescription className="text-red-700">
          {isDeleteAll 
            ? `Permanent radering av all data för ${userEmail}`
            : `Schemalägg eller utför omedelbar radering av möte ${meetingId}`
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {retentionInfo && (
          <div className="rounded-md bg-white p-3 border border-red-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Retention-profil:</span>
              <Badge variant="outline" className="text-xs">
                {profile?.toUpperCase()} - {retentionInfo.days} dagar
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Databoende:</span>
              <span className="font-medium">{retentionInfo.residency}</span>
            </div>
          </div>
        )}

        {result && (
          <Alert>
            <Download className="h-4 w-4" />
            <AlertTitle>Retention utförd</AlertTitle>
            <AlertDescription className="space-y-2">
              <div className="text-sm">
                <strong>Audit-hash:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{result.auditHash}</code>
              </div>
              {result.deletedRecords && (
                <div className="text-sm">
                  <strong>Raderade poster:</strong> {Object.entries(result.deletedRecords)
                    .filter(([_, count]) => count > 0)
                    .map(([type, count]) => `${type}: ${count}`)
                    .join(", ")
                  }
                </div>
              )}
              {result.deletedMeetings && (
                <div className="text-sm">
                  <strong>Raderade möten:</strong> {result.deletedMeetings}
                </div>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={downloadConsentReceipt}
                className="mt-2"
              >
                <Download className="h-3 w-3 mr-1" />
                Ladda ner consent receipt
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleteAll ? "Radera all data" : "Radera möte"}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Bekräfta radering
              </DialogTitle>
              <DialogDescription>
                {isDeleteAll 
                  ? `Detta kommer att permanent radera ALL data för ${userEmail}. Denna åtgärd kan inte ångras.`
                  : `Detta kommer att permanent radera möte ${meetingId} och all relaterad data. Denna åtgärd kan inte ångras.`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Varning!</AlertTitle>
                <AlertDescription>
                  Denna åtgärd är permanent och kan inte ångras. 
                  En audit-logg och consent receipt kommer att genereras.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="confirmation">
                  Skriv <code className="bg-gray-100 px-1 rounded">{confirmationRequired}</code> för att bekräfta:
                </Label>
                <Input
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={confirmationRequired}
                  className="font-mono"
                />
              </div>

              {retentionInfo && (
                <div className="rounded-md bg-gray-50 p-3 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Retention-information:</span>
                  </div>
                  <div className="space-y-1 text-gray-600">
                    <div>Profil: {profile?.toUpperCase()}</div>
                    <div>Retention: {retentionInfo.days} dagar</div>
                    <div>Databoende: {retentionInfo.residency}</div>
                  </div>
                </div>
              )}
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
                variant="destructive" 
                onClick={handleRetention}
                disabled={isLoading || confirmationText !== confirmationRequired}
              >
                {isLoading ? "Raderar..." : "Bekräfta radering"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
