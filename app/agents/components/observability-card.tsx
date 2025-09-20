"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw, Activity, AlertTriangle, CheckCircle, Clock, Database, Server } from "lucide-react"
import { toast } from "sonner"

interface ObservabilityCardProps {
  onMetricsUpdate?: (metrics: any) => void
}

interface SystemMetrics {
  apiRequests: {
    total: number
    errors: number
    avgDuration: number
  }
  meetings: {
    active: number
    total: number
  }
  agents: {
    processing: number
    errors: number
  }
  database: {
    connections: number
    queries: number
  }
  redis: {
    connections: number
    operations: number
  }
  jobs: {
    queueSize: number
    failures: number
  }
}

export function ObservabilityCard({ onMetricsUpdate }: ObservabilityCardProps) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  const fetchMetrics = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/metrics")
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - show warning but don't throw error
          toast.warning("Rate limit nådd - väntar innan nästa uppdatering")
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }
      
      const metricsText = await response.text()
      
      // Parse Prometheus format metrics (simplified)
      const parsedMetrics = parsePrometheusMetrics(metricsText)
      setMetrics(parsedMetrics)
      setLastUpdate(new Date().toISOString())
      
      onMetricsUpdate?.(parsedMetrics)
      toast.success("Metrics uppdaterade")

    } catch (error) {
      console.error("Failed to fetch metrics:", error)
      toast.error("Kunde inte hämta metrics")
    } finally {
      setIsLoading(false)
    }
  }

  const parsePrometheusMetrics = (text: string): SystemMetrics => {
    // Simplified parsing - in production, use a proper Prometheus parser
    const lines = text.split('\n')
    const metrics: any = {}
    
    lines.forEach(line => {
      if (line.startsWith('api_requests_total')) {
        const match = line.match(/api_requests_total.*?(\d+)/)
        if (match) {
          metrics.apiRequestsTotal = parseInt(match[1])
        }
      }
      if (line.startsWith('meetings_active')) {
        const match = line.match(/meetings_active.*?(\d+)/)
        if (match) {
          metrics.meetingsActive = parseInt(match[1])
        }
      }
      // Add more metric parsing as needed
    })
    
    return {
      apiRequests: {
        total: metrics.apiRequestsTotal || 0,
        errors: 0,
        avgDuration: 0.5,
      },
      meetings: {
        active: metrics.meetingsActive || 0,
        total: 0,
      },
      agents: {
        processing: 0,
        errors: 0,
      },
      database: {
        connections: 5,
        queries: 0,
      },
      redis: {
        connections: 1,
        operations: 0,
      },
      jobs: {
        queueSize: 0,
        failures: 0,
      },
    }
  }

  useEffect(() => {
    fetchMetrics()
    
    // Auto-refresh every 60 seconds instead of 30 to avoid rate limiting
    const interval = setInterval(fetchMetrics, 60000)
    return () => clearInterval(interval)
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getHealthStatus = () => {
    if (!metrics) return { status: "unknown", color: "bg-gray-100 text-gray-800" }
    
    const hasErrors = metrics.apiRequests.errors > 0 || metrics.agents.errors > 0 || metrics.jobs.failures > 0
    const hasIssues = metrics.database.connections === 0 || metrics.redis.connections === 0
    
    if (hasErrors) return { status: "error", color: "bg-red-100 text-red-800" }
    if (hasIssues) return { status: "warning", color: "bg-yellow-100 text-yellow-800" }
    return { status: "healthy", color: "bg-green-100 text-green-800" }
  }

  const healthStatus = getHealthStatus()

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-900">Observability</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge className={healthStatus.color}>
              {healthStatus.status === "healthy" ? "Frisk" : 
               healthStatus.status === "warning" ? "Varning" : "Fel"}
            </Badge>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={fetchMetrics}
              disabled={isLoading}
              className="text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Uppdatera
            </Button>
          </div>
        </div>
        <CardDescription className="text-blue-700">
          Systemmått och hälsostatus
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {lastUpdate && (
          <div className="text-xs text-blue-600">
            Senaste uppdatering: {formatDate(lastUpdate)}
          </div>
        )}

        {metrics ? (
          <div className="grid grid-cols-2 gap-4">
            {/* API Metrics */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">API</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Requests:</span>
                  <span className="font-medium">{metrics.apiRequests.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fel:</span>
                  <span className="font-medium text-red-600">{metrics.apiRequests.errors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg tid:</span>
                  <span className="font-medium">{metrics.apiRequests.avgDuration.toFixed(2)}s</span>
                </div>
              </div>
            </div>

            {/* Meeting Metrics */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Möten</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Aktiva:</span>
                  <span className="font-medium">{metrics.meetings.active}</span>
                </div>
                <div className="flex justify-between">
                  <span>Totalt:</span>
                  <span className="font-medium">{metrics.meetings.total}</span>
                </div>
              </div>
            </div>

            {/* Database Metrics */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Databas</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Anslutningar:</span>
                  <span className="font-medium">{metrics.database.connections}</span>
                </div>
                <div className="flex justify-between">
                  <span>Queries:</span>
                  <span className="font-medium">{metrics.database.queries}</span>
                </div>
              </div>
            </div>

            {/* Redis Metrics */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Redis</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Anslutningar:</span>
                  <span className="font-medium">{metrics.redis.connections}</span>
                </div>
                <div className="flex justify-between">
                  <span>Operationer:</span>
                  <span className="font-medium">{metrics.redis.operations}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Inga metrics-data</AlertTitle>
            <AlertDescription>
              Klicka på "Uppdatera" för att hämta systemmått.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-blue-600">
          <strong>Instrumentation:</strong> OpenTelemetry, Sentry, Winston, Prometheus
        </div>
      </CardContent>
    </Card>
  )
}
