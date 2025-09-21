"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, AlertCircle, CheckCircle, Clock, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface QueueJob {
  id: string
  queue: string
  name: string
  data: any
  status: "waiting" | "active" | "completed" | "failed" | "delayed" | "stalled"
  progress?: number
  attempts: number
  maxAttempts: number
  failedReason?: string
  processedOn?: string
  finishedOn?: string
  delay?: number
  retryCount?: number
  idempotencyKey?: string
}

interface DeadLetterJob {
  id: string
  originalJobId: string
  originalQueue: string
  originalData: any
  failureReason: string
  failedAt: string
  retryCount: number
  canRetry: boolean
}

interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  stalled: number
}

export function QueueDashboardCard() {
  const [activeJobs, setActiveJobs] = useState<QueueJob[]>([])
  const [deadLetterJobs, setDeadLetterJobs] = useState<DeadLetterJob[]>([])
  const [stats, setStats] = useState<QueueStats>({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    stalled: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [retryDelay, setRetryDelay] = useState(30000) // Start with 30 seconds

  const fetchQueueData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch queue statistics and jobs
      const [statsResponse, jobsResponse, dlqResponse] = await Promise.all([
        fetch("/api/agents/queues/stats"),
        fetch("/api/agents/queues/jobs"),
        fetch("/api/agents/queues/dead-letter"),
      ])

      // Check for rate limit errors
      const hasRateLimitError = [statsResponse, jobsResponse, dlqResponse].some(
        response => response.status === 429
      )

      if (hasRateLimitError) {
        // Exponential backoff: double the delay, max 5 minutes
        setRetryDelay(prev => Math.min(prev * 2, 300000))
        console.warn("Rate limit exceeded, increasing retry delay to", retryDelay * 2, "ms")
        return
      }

      // Reset delay on successful request
      setRetryDelay(30000)

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data || stats)
      }

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json()
        setActiveJobs(jobsData.data || [])
      }

      if (dlqResponse.ok) {
        const dlqData = await dlqResponse.json()
        setDeadLetterJobs(dlqData.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch queue data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const retryJob = async (jobId: string, originalQueue: string) => {
    try {
      const response = await fetch("/api/agents/queues/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, originalQueue }),
      })

      if (!response.ok) {
        throw new Error("Failed to retry job")
      }

      toast.success("Job queued for retry")
      fetchQueueData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to retry job")
    }
  }

  const clearDeadLetterJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/agents/queues/dead-letter/${jobId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to clear dead letter job")
      }

      toast.success("Dead letter job cleared")
      fetchQueueData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to clear job")
    }
  }

  useEffect(() => {
    fetchQueueData()

    let interval: NodeJS.Timeout | null = null
    if (autoRefresh) {
      interval = setInterval(fetchQueueData, retryDelay) // Use dynamic retry delay
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, retryDelay])

  const getStatusIcon = (status: QueueJob["status"]) => {
    switch (status) {
      case "active":
        return <Activity className="h-4 w-4 text-blue-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "delayed":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "stalled":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: QueueJob["status"]) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      waiting: "outline",
      active: "default",
      completed: "secondary",
      failed: "destructive",
      delayed: "outline",
      stalled: "destructive",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString("sv-SE")
  }

  return (
    <Card className="border-indigo-200 bg-indigo-50/50 col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg text-indigo-900">
              Queue Dashboard
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
              {autoRefresh ? "Auto" : "Manual"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQueueData}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>
        <CardDescription className="text-indigo-700">
          Spårbara retries, DLQ-hantering och queue-statistik
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Queue Statistics */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {Object.entries(stats).map(([status, count]) => (
            <div key={status} className="text-center p-2 rounded-md bg-white border border-indigo-200">
              <div className="text-lg font-semibold text-indigo-900">{count}</div>
              <div className="text-xs text-indigo-600 capitalize">{status}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active Jobs</TabsTrigger>
            <TabsTrigger value="dlq">
              Dead Letter Queue ({deadLetterJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeJobs.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Queue</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeJobs.slice(0, 10).map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(job.status)}
                            {getStatusBadge(job.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {job.queue}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-32 truncate font-mono text-sm">
                            {job.name}
                          </div>
                          {job.idempotencyKey && (
                            <div className="text-xs text-gray-500 truncate">
                              Key: {job.idempotencyKey}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={job.attempts >= job.maxAttempts ? "text-red-600" : ""}>
                            {job.attempts}/{job.maxAttempts}
                          </span>
                        </TableCell>
                        <TableCell>
                          {job.progress !== undefined ? `${job.progress}%` : "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(job.processedOn)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-indigo-600">
                Inga aktiva jobb för närvarande
              </div>
            )}
          </TabsContent>

          <TabsContent value="dlq" className="space-y-4">
            {deadLetterJobs.length > 0 ? (
              <div className="space-y-3">
                {deadLetterJobs.slice(0, 10).map((dlqJob) => (
                  <Alert key={dlqJob.id} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="flex items-center justify-between">
                      <span>Dead Letter Job: {dlqJob.originalQueue}</span>
                      <div className="flex items-center gap-2">
                        {dlqJob.canRetry && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryJob(dlqJob.id, dlqJob.originalQueue)}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => clearDeadLetterJob(dlqJob.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </AlertTitle>
                    <AlertDescription className="mt-2 space-y-1">
                      <div className="text-sm">
                        <strong>Original Job ID:</strong> {dlqJob.originalJobId}
                      </div>
                      <div className="text-sm">
                        <strong>Failed At:</strong> {formatDate(dlqJob.failedAt)}
                      </div>
                      <div className="text-sm">
                        <strong>Retry Count:</strong> {dlqJob.retryCount}
                      </div>
                      <div className="text-sm">
                        <strong>Failure Reason:</strong> {dlqJob.failureReason}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-green-600">
                Inga misslyckade jobb i DLQ 🎉
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
