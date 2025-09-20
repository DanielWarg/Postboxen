"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw, ExternalLink, AlertTriangle, Info, Clock } from "lucide-react"
import { toast } from "sonner"

interface RegwatchCardProps {
  onRegwatchUpdate?: (results: any) => void
}

interface RegwatchResult {
  source: {
    id: string
    title: string
    jurisdiction: string
    url: string
    lastChecked: string
  }
  changes: Array<{
    sourceId: string
    section: string
    summary: string
    impactAreas: string[]
    severity: "info" | "warning" | "critical"
    effectiveDate?: string
  }>
  recommendation: string
  checkedAt: string
}

export function RegwatchCard({ onRegwatchUpdate }: RegwatchCardProps) {
  const [highlights, setHighlights] = useState<RegwatchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastCheck, setLastCheck] = useState<string | null>(null)

  const fetchHighlights = async () => {
    try {
      const response = await fetch("/api/agents/regwatch?action=highlights&limit=3")
      const data = await response.json()
      
      if (data.success) {
        setHighlights(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch regwatch highlights:", error)
    }
  }

  const triggerCheck = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/agents/regwatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger" }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Okänt fel")
      }

      setLastCheck(new Date().toISOString())
      toast.success(data.message)
      onRegwatchUpdate?.(data.data)
      
      // Uppdatera highlights efter kontroll
      await fetchHighlights()

    } catch (error) {
      console.error("Regwatch check error:", error)
      toast.error(error instanceof Error ? error.message : "Okänt fel")
    } finally {
      setIsLoading(false)
    }
  }

  const scheduleDailyCheck = async () => {
    try {
      const response = await fetch("/api/agents/regwatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule" }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Okänt fel")
      }

      toast.success("Daglig regwatch-kontroll schemalagd")
      onRegwatchUpdate?.(data.data)

    } catch (error) {
      console.error("Schedule regwatch error:", error)
      toast.error(error instanceof Error ? error.message : "Okänt fel")
    }
  }

  useEffect(() => {
    fetchHighlights()
  }, [])

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityVariant = (severity: string): "destructive" | "secondary" | "outline" => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "warning":
        return "secondary"
      default:
        return "outline"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sv-SE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-900">Regwatch</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={scheduleDailyCheck}
              className="text-xs"
            >
              Schemalägg
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={triggerCheck}
              disabled={isLoading}
              className="text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Kontrollera nu
            </Button>
          </div>
        </div>
        <CardDescription className="text-blue-700">
          Bevakar regulatoriska förändringar i EU och Sverige
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {lastCheck && (
          <div className="text-xs text-blue-600">
            Senaste kontroll: {formatDate(lastCheck)}
          </div>
        )}

        {highlights.length > 0 ? (
          <div className="space-y-3">
            {highlights.map((result) => (
              <div key={result.source.id} className="rounded-md bg-white p-3 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-blue-900">
                      {result.source.title}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {result.source.jurisdiction}
                    </Badge>
                  </div>
                  <a 
                    href={result.source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {result.changes.length > 0 ? (
                  <div className="space-y-2">
                    {result.changes.map((change, index) => (
                      <div key={index} className="flex items-start gap-2">
                        {getSeverityIcon(change.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-700">
                              {change.section}
                            </span>
                            <Badge 
                              variant={getSeverityVariant(change.severity)} 
                              className="text-xs"
                            >
                              {change.severity === "critical" ? "Kritisk" : 
                               change.severity === "warning" ? "Varning" : "Info"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">
                            {change.summary}
                          </p>
                          {change.impactAreas.length > 0 && (
                            <div className="text-xs text-gray-500">
                              Påverkan: {change.impactAreas.join(", ")}
                            </div>
                          )}
                          {change.effectiveDate && (
                            <div className="text-xs text-gray-500">
                              Gäller från: {formatDate(change.effectiveDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    Inga ändringar hittades
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-600">
                  Kontrollerad: {formatDate(result.checkedAt)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Inga regwatch-data</AlertTitle>
            <AlertDescription>
              Kör en kontroll för att hämta senaste regulatoriska förändringar.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-blue-600">
          <strong>Källor:</strong> EU AI Act, GDPR Guidelines, LOU 2023, Dataskyddsmyndigheten, Konkurrensverket
        </div>
      </CardContent>
    </Card>
  )
}
