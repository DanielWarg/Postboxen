import { createLogger } from './logger'

// Simple metrics collection (in production, use prom-client)
interface MetricValue {
  value: number
  timestamp: number
  labels?: Record<string, string>
}

interface Metric {
  name: string
  type: 'counter' | 'gauge' | 'histogram' | 'summary'
  help: string
  values: MetricValue[]
}

class MetricsCollector {
  private metrics: Map<string, Metric> = new Map()
  private logger = createLogger()

  // Counter metrics
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>) {
    const metric = this.getOrCreateMetric(name, 'counter', `Counter for ${name}`)
    metric.values.push({
      value: (metric.values[metric.values.length - 1]?.value || 0) + value,
      timestamp: Date.now(),
      labels,
    })
    
    // Keep only last 1000 values
    if (metric.values.length > 1000) {
      metric.values = metric.values.slice(-1000)
    }
  }

  // Gauge metrics
  setGauge(name: string, value: number, labels?: Record<string, string>) {
    const metric = this.getOrCreateMetric(name, 'gauge', `Gauge for ${name}`)
    metric.values.push({
      value,
      timestamp: Date.now(),
      labels,
    })
    
    // Keep only last 1000 values
    if (metric.values.length > 1000) {
      metric.values = metric.values.slice(-1000)
    }
  }

  // Histogram metrics
  observeHistogram(name: string, value: number, labels?: Record<string, string>) {
    const metric = this.getOrCreateMetric(name, 'histogram', `Histogram for ${name}`)
    metric.values.push({
      value,
      timestamp: Date.now(),
      labels,
    })
    
    // Keep only last 1000 values
    if (metric.values.length > 1000) {
      metric.values = metric.values.slice(-1000)
    }
  }

  // Get metric
  getMetric(name: string): Metric | undefined {
    return this.metrics.get(name)
  }

  // Get all metrics
  getAllMetrics(): Metric[] {
    return Array.from(this.metrics.values())
  }

  // Get metrics in Prometheus format
  getPrometheusFormat(): string {
    let output = ''
    
    for (const metric of this.metrics.values()) {
      output += `# HELP ${metric.name} ${metric.help}\n`
      output += `# TYPE ${metric.name} ${metric.type}\n`
      
      for (const value of metric.values) {
        const labels = value.labels ? 
          `{${Object.entries(value.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}` : 
          ''
        output += `${metric.name}${labels} ${value.value} ${value.timestamp}\n`
      }
    }
    
    return output
  }

  private getOrCreateMetric(name: string, type: Metric['type'], help: string): Metric {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        name,
        type,
        help,
        values: [],
      })
    }
    return this.metrics.get(name)!
  }
}

// Global metrics collector
export const metrics = new MetricsCollector()

// Predefined metrics for the agent platform
export const agentMetrics = {
  // Meeting metrics
  meetingsTotal: () => metrics.incrementCounter('postboxen_agent_meetings_total'),
  meetingsActive: (count: number) => metrics.setGauge('postboxen_meetings_active', count),
  meetingDuration: (duration: number) => metrics.observeHistogram('postboxen_meeting_duration_seconds', duration),
  
  // Decision metrics
  decisionsTotal: () => metrics.incrementCounter('postboxen_agent_decisions_total'),
  decisionsPerMeeting: (count: number) => metrics.observeHistogram('postboxen_decisions_per_meeting', count),
  
  // Action metrics
  actionsTotal: () => metrics.incrementCounter('postboxen_agent_actions_total'),
  actionsCompleted: () => metrics.incrementCounter('postboxen_actions_completed_total'),
  actionsOverdue: () => metrics.incrementCounter('postboxen_actions_overdue_total'),
  
  // API metrics
  apiRequestsTotal: (method: string, endpoint: string, statusCode: number) => 
    metrics.incrementCounter('http_requests_total', 1, { method, endpoint, status: statusCode.toString() }),
  apiRequestDuration: (method: string, endpoint: string, duration: number) => 
    metrics.observeHistogram('http_request_duration_seconds', duration, { method, endpoint }),
  
  // Agent metrics
  agentProcessingTime: (agentType: string, duration: number) => 
    metrics.observeHistogram('postboxen_agent_processing_duration_seconds', duration, { agent_type: agentType }),
  agentErrors: (agentType: string) => 
    metrics.incrementCounter('postboxen_agent_errors_total', 1, { agent_type: agentType }),
  
  // Retention metrics
  retentionJobsScheduled: () => metrics.incrementCounter('postboxen_retention_jobs_scheduled_total'),
  retentionJobsExecuted: () => metrics.incrementCounter('postboxen_retention_jobs_executed_total'),
  retentionRecordsDeleted: (count: number) => metrics.incrementCounter('postboxen_retention_records_deleted_total', count),
  
  // Regwatch metrics
  regwatchChecksTotal: () => metrics.incrementCounter('postboxen_regwatch_checks_total'),
  regwatchChangesDetected: (source: string) => 
    metrics.incrementCounter('postboxen_regwatch_changes_detected_total', 1, { source }),
  regwatchErrors: (source: string) => 
    metrics.incrementCounter('postboxen_regwatch_errors_total', 1, { source }),
  
  // Database metrics
  dbConnectionsActive: (count: number) => metrics.setGauge('postboxen_db_connections_active', count),
  dbConnectionsIdle: (count: number) => metrics.setGauge('postboxen_db_connections_idle', count),
  dbQueryDuration: (query: string, duration: number) => 
    metrics.observeHistogram('postboxen_db_query_duration_seconds', duration, { query }),
  
  // Redis metrics
  redisConnectionsActive: (count: number) => metrics.setGauge('redis_connections_active', count),
  redisMemoryUsed: (bytes: number) => metrics.setGauge('redis_memory_used_bytes', bytes),
  redisMemoryMax: (bytes: number) => metrics.setGauge('redis_memory_max_bytes', bytes),
  redisOperationsTotal: (operation: string) => 
    metrics.incrementCounter('redis_operations_total', 1, { operation }),
  
  // Job queue metrics
  jobQueueSize: (queue: string, status: string, size: number) => 
    metrics.setGauge('postboxen_queue_jobs_total', size, { queue, status }),
  jobProcessingDuration: (queue: string, duration: number) => 
    metrics.observeHistogram('postboxen_job_processing_duration_seconds', duration, { queue }),
  jobFailures: (queue: string) => 
    metrics.incrementCounter('postboxen_job_failures_total', 1, { queue }),
  
  // Security metrics
  rateLimitHits: () => metrics.incrementCounter('postboxen_rate_limit_hits_total'),
  authFailures: () => metrics.incrementCounter('postboxen_auth_failures_total'),
  authSuccesses: () => metrics.incrementCounter('postboxen_auth_successes_total'),
  
  // System metrics
  cpuUsage: (usage: number) => metrics.setGauge('process_cpu_seconds_total', usage),
  memoryUsage: (bytes: number) => metrics.setGauge('process_resident_memory_bytes', bytes),
  
  // Business metrics
  userSessions: (count: number) => metrics.setGauge('postboxen_user_sessions_active', count),
  consentGiven: (level: string) => metrics.incrementCounter('postboxen_consent_given_total', 1, { level }),
  consentRevoked: (level: string) => metrics.incrementCounter('postboxen_consent_revoked_total', 1, { level }),
}

// Middleware for automatic API metrics
export const apiMetricsMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now()
  const method = req.method
  const endpoint = req.route?.path || req.path
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000
    const statusCode = res.statusCode
    
    agentMetrics.apiRequestsTotal(method, endpoint, statusCode)
    agentMetrics.apiRequestDuration(method, endpoint, duration)
  })
  
  next()
}

// Export metrics endpoint handler
export const metricsHandler = (req: any, res: any) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  res.status(200).send(metrics.getPrometheusFormat())
}

export default metrics
