"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  HardDrive, 
  MemoryStick, 
  RefreshCw,
  Server,
  Users,
  Zap
} from "lucide-react"
import { toast } from "sonner"

interface MetricData {
  name: string
  value: number
  labels?: Record<string, string>
  timestamp: number
}

interface SystemMetrics {
  application: {
    status: "healthy" | "degraded" | "down"
    uptime: number
    version: string
  }
  performance: {
    requestsPerSecond: number
    averageResponseTime: number
    errorRate: number
  }
  resources: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
  }
  database: {
    connections: number
    queryTime: number
    status: "healthy" | "degraded" | "down"
  }
  redis: {
    memoryUsed: number
    memoryMax: number
    operations: number
    status: "healthy" | "degraded" | "down"
  }
  queues: {
    waiting: number
    active: number
    failed: number
    completed: number
  }
  business: {
    meetingsProcessed: number
    decisionsMade: number
    actionsCreated: number
    userSessions: number
  }
}

export function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMetrics = async () => {
    try {
      setIsLoading(true)
      
      // Fetch metrics from multiple endpoints
      const [healthResponse, metricsResponse, queueResponse] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/metrics"),
        fetch("/api/agents/queues/stats")
      ])

      if (!healthResponse.ok || !metricsResponse.ok || !queueResponse.ok) {
        throw new Error("Failed to fetch metrics")
      }

      const healthData = await healthResponse.json()
      const queueData = await queueResponse.json()

      // Parse Prometheus metrics (simplified)
      const metricsText = await metricsResponse.text()
      const parsedMetrics = parsePrometheusMetrics(metricsText)

      // Build system metrics object
      const systemMetrics: SystemMetrics = {
        application: {
          status: healthData.status === "healthy" ? "healthy" : "degraded",
          uptime: parsedMetrics.process_start_time_seconds || 0,
          version: "1.0.0"
        },
        performance: {
          requestsPerSecond: parsedMetrics.http_requests_total_rate || 0,
          averageResponseTime: parsedMetrics.http_request_duration_seconds_avg || 0,
          errorRate: parsedMetrics.http_requests_total_5xx_rate || 0
        },
        resources: {
          cpuUsage: parsedMetrics.process_cpu_seconds_total || 0,
          memoryUsage: parsedMetrics.process_resident_memory_bytes || 0,
          diskUsage: parsedMetrics.process_disk_usage_bytes || 0
        },
        database: {
          connections: parsedMetrics.postboxen_db_connections_active || 0,
          queryTime: parsedMetrics.postboxen_db_query_duration_seconds_avg || 0,
          status: parsedMetrics.postboxen_db_connections_active > 0 ? "healthy" : "down"
        },
        redis: {
          memoryUsed: parsedMetrics.redis_memory_used_bytes || 0,
          memoryMax: parsedMetrics.redis_memory_max_bytes || 0,
          operations: parsedMetrics.redis_operations_total || 0,
          status: parsedMetrics.redis_memory_used_bytes > 0 ? "healthy" : "down"
        },
        queues: queueData.data || {
          waiting: 0,
          active: 0,
          failed: 0,
          completed: 0
        },
        business: {
          meetingsProcessed: parsedMetrics.postboxen_agent_meetings_total || 0,
          decisionsMade: parsedMetrics.postboxen_agent_decisions_total || 0,
          actionsCreated: parsedMetrics.postboxen_agent_actions_total || 0,
          userSessions: parsedMetrics.postboxen_user_sessions_active || 0
        }
      }

      setMetrics(systemMetrics)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
      toast.error("Failed to fetch metrics")
    } finally {
      setIsLoading(false)
    }
  }

  const parsePrometheusMetrics = (text: string): Record<string, number> => {
    const metrics: Record<string, number> = {}
    const lines = text.split('\n')
    
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue
      
      const [nameValue, timestamp] = line.split(' ')
      if (!nameValue) continue
      
      const [name, value] = nameValue.split(' ')
      if (name && value) {
        metrics[name] = parseFloat(value)
      }
    }
    
    return metrics
  }

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-600"
      case "degraded": return "text-yellow-600"
      case "down": return "text-red-600"
      default: return "text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="h-4 w-4 text-green-600" />
      case "degraded": return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "down": return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(2)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`
  }

  if (!metrics) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-blue-600">Loading metrics...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-900">
              System Monitoring
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMetrics}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {lastUpdated && (
              <Badge variant="outline" className="text-xs">
                {lastUpdated.toLocaleTimeString()}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-blue-700">
          Real-time system metrics and health monitoring
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Application Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(metrics.application.status)}
                    <span className="font-medium">Application</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Status: <span className={getStatusColor(metrics.application.status)}>
                      {metrics.application.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Uptime: {formatDuration(metrics.application.uptime)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(metrics.database.status)}
                    <span className="font-medium">Database</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Connections: {metrics.database.connections}
                  </div>
                  <div className="text-sm text-gray-600">
                    Query Time: {metrics.database.queryTime.toFixed(2)}ms
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(metrics.redis.status)}
                    <span className="font-medium">Redis</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Memory: {formatBytes(metrics.redis.memoryUsed)} / {formatBytes(metrics.redis.memoryMax)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Operations: {metrics.redis.operations}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Queue Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Queue Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{metrics.queues.waiting}</div>
                    <div className="text-sm text-gray-600">Waiting</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{metrics.queues.active}</div>
                    <div className="text-sm text-gray-600">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{metrics.queues.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{metrics.queues.completed}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Requests/sec</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.performance.requestsPerSecond.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Avg Response</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {metrics.performance.averageResponseTime.toFixed(2)}ms
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Error Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {(metrics.performance.errorRate * 100).toFixed(2)}%
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">CPU Usage</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {(metrics.resources.cpuUsage * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MemoryStick className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Memory</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatBytes(metrics.resources.memoryUsage)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <HardDrive className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Disk</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatBytes(metrics.resources.diskUsage)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="business" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {metrics.business.meetingsProcessed}
                  </div>
                  <div className="text-sm text-gray-600">Meetings</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {metrics.business.decisionsMade}
                  </div>
                  <div className="text-sm text-gray-600">Decisions</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {metrics.business.actionsCreated}
                  </div>
                  <div className="text-sm text-gray-600">Actions</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {metrics.business.userSessions}
                  </div>
                  <div className="text-sm text-gray-600">Sessions</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Alerts */}
        {metrics.application.status !== "healthy" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              System status is {metrics.application.status}. Please check the logs for more details.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
