# Performance Optimization Plan - Postboxen Agent Platform

## Översikt
Denna plan fokuserar på att optimera prestanda för Postboxen Agent Platform genom caching, skalning och optimering av kritiska komponenter.

## Identifierade Performance Bottlenecks

### 🔴 KRITISKA BOTTLENECKS

#### 1. Database Queries
- **Problem**: N+1 queries i Prisma
- **Impact**: Långsamma API-svar (500ms+)
- **Lösning**: Implementera eager loading och query optimization
- **Prioritet**: HÖGST

#### 2. Redis Cache Misses
- **Problem**: Otillräcklig cache-strategi
- **Impact**: Onödiga databas-anrop
- **Lösning**: Implementera intelligent caching med TTL
- **Prioritet**: HÖG

#### 3. BullMQ Job Processing
- **Problem**: Sekventiell jobbhantering
- **Impact**: Långsam meeting processing
- **Lösning**: Parallell jobbhantering och worker scaling
- **Prioritet**: HÖG

#### 4. API Response Times
- **Problem**: Stora payloads och otoptimerade queries
- **Impact**: Långsam frontend-upplevelse
- **Lösning**: Pagination, field selection, compression
- **Prioritet**: HÖG

### 🟡 MEDELPRIORITET

#### 5. Frontend Bundle Size
- **Problem**: Stora JavaScript-bundles
- **Impact**: Långsam initial load
- **Lösning**: Code splitting och lazy loading
- **Prioritet**: MEDEL

#### 6. Image Optimization
- **Problem**: Ooptimerade bilder
- **Impact**: Långsam bildladdning
- **Lösning**: Next.js Image optimization
- **Prioritet**: MEDEL

#### 7. Database Connection Pooling
- **Problem**: Otillräcklig connection pooling
- **Impact**: Connection timeouts
- **Lösning**: Optimera Prisma connection pool
- **Prioritet**: MEDEL

## Performance Optimization Implementation

### 1. Database Query Optimization

#### Prisma Query Optimization
```typescript
// lib/db/optimized-queries.ts
export const optimizedMeetingQueries = {
  // Eager loading för att undvika N+1 queries
  getMeetingWithRelations: async (meetingId: string) => {
    return prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        consent: true,
        decisionCards: true,
        actionItems: true,
        briefs: true,
        stakeholders: true,
        transcriptSegments: {
          orderBy: { timestamp: 'asc' },
          take: 100, // Limit transcript segments
        },
      },
    })
  },

  // Paginerade queries för stora datasets
  getMeetingsPaginated: async (page: number = 1, limit: number = 20) => {
    const skip = (page - 1) * limit
    return prisma.meeting.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        organizerEmail: true,
        startTime: true,
        endTime: true,
        status: true,
        platform: true,
        // Exclude heavy fields like transcript
      },
    })
  },

  // Aggregated queries för dashboard
  getDashboardStats: async () => {
    const [totalMeetings, activeMeetings, completedMeetings] = await Promise.all([
      prisma.meeting.count(),
      prisma.meeting.count({ where: { status: 'active' } }),
      prisma.meeting.count({ where: { status: 'completed' } }),
    ])

    return {
      totalMeetings,
      activeMeetings,
      completedMeetings,
    }
  },
}
```

#### Database Indexing
```sql
-- Optimera databasindex för vanliga queries
CREATE INDEX CONCURRENTLY idx_meetings_organizer_email ON meetings(organizer_email);
CREATE INDEX CONCURRENTLY idx_meetings_status ON meetings(status);
CREATE INDEX CONCURRENTLY idx_meetings_start_time ON meetings(start_time);
CREATE INDEX CONCURRENTLY idx_meetings_created_at ON meetings(created_at);

CREATE INDEX CONCURRENTLY idx_decision_cards_meeting_id ON decision_cards(meeting_id);
CREATE INDEX CONCURRENTLY idx_action_items_meeting_id ON action_items(meeting_id);
CREATE INDEX CONCURRENTLY idx_transcript_segments_meeting_id ON transcript_segments(meeting_id);

-- Composite indexes för komplexa queries
CREATE INDEX CONCURRENTLY idx_meetings_organizer_status ON meetings(organizer_email, status);
CREATE INDEX CONCURRENTLY idx_meetings_created_status ON meetings(created_at, status);
```

### 2. Redis Caching Strategy

#### Intelligent Caching Layer
```typescript
// lib/cache/strategies.ts
export const cacheStrategies = {
  // Meeting data caching
  meeting: {
    ttl: 300, // 5 minutes
    key: (id: string) => `meeting:${id}`,
    invalidateOn: ['meeting:update', 'meeting:delete'],
  },

  // Dashboard stats caching
  dashboard: {
    ttl: 60, // 1 minute
    key: (userId: string) => `dashboard:${userId}`,
    invalidateOn: ['meeting:create', 'meeting:update', 'meeting:delete'],
  },

  // User consent caching
  consent: {
    ttl: 1800, // 30 minutes
    key: (email: string) => `consent:${email}`,
    invalidateOn: ['consent:update'],
  },

  // Queue stats caching
  queues: {
    ttl: 30, // 30 seconds
    key: () => 'queue:stats',
    invalidateOn: ['queue:job:complete', 'queue:job:fail'],
  },
}

// lib/cache/manager.ts
export class CacheManager {
  private redis = getRedisClient()

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null
    
    const cached = await this.redis.get(key)
    return cached ? JSON.parse(cached) : null
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    if (!this.redis) return
    
    await this.redis.setex(key, ttl, JSON.stringify(value))
  }

  async invalidate(pattern: string): Promise<void> {
    if (!this.redis) return
    
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }

  async invalidateByEvent(event: string): Promise<void> {
    const strategies = Object.values(cacheStrategies)
    const patterns = strategies
      .filter(s => s.invalidateOn.includes(event))
      .map(s => s.key('*'))
    
    for (const pattern of patterns) {
      await this.invalidate(pattern)
    }
  }
}
```

### 3. BullMQ Performance Optimization

#### Worker Scaling och Parallel Processing
```typescript
// lib/queues/optimized.ts
export const optimizedQueueConfig = {
  meetingProcessing: {
    concurrency: 5, // Öka från 2 till 5
    settings: {
      stalledInterval: 30 * 1000,
      maxStalledCount: 1,
    },
    jobOptions: {
      removeOnComplete: 50, // Behåll fler completed jobs
      removeOnFail: 20,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  },

  briefing: {
    concurrency: 3, // Öka från 1 till 3
    settings: {
      stalledInterval: 30 * 1000,
      maxStalledCount: 1,
    },
    jobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
    },
  },

  notifications: {
    concurrency: 10, // Öka från 3 till 10
    settings: {
      stalledInterval: 30 * 1000,
      maxStalledCount: 1,
    },
    jobOptions: {
      removeOnComplete: 200,
      removeOnFail: 100,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  },
}

// Optimized job processors
export const optimizedJobProcessors = {
  processMeetingJob: async (job: Job<MeetingProcessingJob>) => {
    const { meetingId, transcript, summary, decisions, actionItems, idempotencyKey } = job.data
    
    try {
      // Parallel processing av olika komponenter
      const [summaryResult, decisionsResult, actionItemsResult] = await Promise.allSettled([
        processSummary(transcript),
        processDecisions(transcript),
        processActionItems(transcript),
      ])

      // Batch database updates
      await prisma.$transaction([
        prisma.meeting.update({
          where: { id: meetingId },
          data: {
            summary: summaryResult.status === 'fulfilled' ? summaryResult.value : null,
            status: 'completed',
            updatedAt: new Date(),
          },
        }),
        // Batch insert decisions
        prisma.decisionCard.createMany({
          data: decisionsResult.status === 'fulfilled' ? decisionsResult.value : [],
        }),
        // Batch insert action items
        prisma.actionItem.createMany({
          data: actionItemsResult.status === 'fulfilled' ? actionItemsResult.value : [],
        }),
      ])

      // Invalidate cache
      await cacheManager.invalidateByEvent('meeting:update')

      return { success: true, meetingId }
    } catch (error) {
      console.error(`Meeting processing failed for ${meetingId}:`, error)
      throw error
    }
  },
}
```

### 4. API Response Optimization

#### Response Compression och Pagination
```typescript
// lib/api/optimization.ts
export const apiOptimization = {
  // Response compression middleware
  compressResponse: (response: NextResponse) => {
    response.headers.set('Content-Encoding', 'gzip')
    return response
  },

  // Pagination helper
  paginate: <T>(data: T[], page: number = 1, limit: number = 20) => {
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = data.slice(startIndex, endIndex)
    
    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: data.length,
        totalPages: Math.ceil(data.length / limit),
        hasNext: endIndex < data.length,
        hasPrev: page > 1,
      },
    }
  },

  // Field selection för att minska payload
  selectFields: <T>(data: T, fields: string[]) => {
    const selected: any = {}
    fields.forEach(field => {
      if (field in data) {
        selected[field] = data[field]
      }
    })
    return selected
  },
}

// Optimized API endpoints
export const optimizedEndpoints = {
  // GET /api/agents/meetings med pagination och caching
  getMeetings: async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const cacheKey = `meetings:page:${page}:limit:${limit}`

    // Try cache first
    const cached = await cacheManager.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Fetch from database
    const meetings = await optimizedMeetingQueries.getMeetingsPaginated(page, limit)
    const result = apiOptimization.paginate(meetings, page, limit)

    // Cache result
    await cacheManager.set(cacheKey, result, 300) // 5 minutes

    return NextResponse.json(result)
  },
}
```

### 5. Frontend Performance Optimization

#### Code Splitting och Lazy Loading
```typescript
// app/agents/components/lazy-components.tsx
import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Lazy load heavy components
const DecisionCardsPage = lazy(() => import('./decision-cards-page'))
const RegwatchPage = lazy(() => import('./regwatch-page'))
const BriefsPage = lazy(() => import('./briefs-page'))

export const LazyDecisionCardsPage = () => (
  <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin" />}>
    <DecisionCardsPage />
  </Suspense>
)

export const LazyRegwatchPage = () => (
  <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin" />}>
    <RegwatchPage />
  </Suspense>
)

export const LazyBriefsPage = () => (
  <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin" />}>
    <BriefsPage />
  </Suspense>
)
```

#### Image Optimization
```typescript
// app/components/optimized-image.tsx
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
}

export const OptimizedImage = ({ src, alt, width, height, priority = false }: OptimizedImageProps) => (
  <Image
    src={src}
    alt={alt}
    width={width}
    height={height}
    priority={priority}
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
)
```

### 6. Database Connection Pooling

#### Prisma Connection Pool Optimization
```typescript
// lib/db/connection-pool.ts
export const optimizedPrismaConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Optimera connection pool
  connectionLimit: 20, // Öka från default 10
  poolTimeout: 30, // 30 sekunder timeout
  connectionTimeout: 10, // 10 sekunder connection timeout
  // Connection pool settings
  __internal: {
    engine: {
      connectionLimit: 20,
      poolTimeout: 30000,
      connectionTimeout: 10000,
    },
  },
}

// lib/db/health-check.ts
export const databaseHealthCheck = async () => {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const duration = Date.now() - start
    
    return {
      status: 'healthy',
      responseTime: duration,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}
```

## Performance Monitoring

### Metrics Collection
```typescript
// lib/performance/metrics.ts
export const performanceMetrics = {
  // API response time tracking
  trackApiResponse: (endpoint: string, duration: number) => {
    console.log(`API_PERF: ${endpoint} - ${duration}ms`)
  },

  // Database query tracking
  trackDbQuery: (query: string, duration: number) => {
    console.log(`DB_PERF: ${query} - ${duration}ms`)
  },

  // Cache hit/miss tracking
  trackCacheHit: (key: string) => {
    console.log(`CACHE_HIT: ${key}`)
  },

  trackCacheMiss: (key: string) => {
    console.log(`CACHE_MISS: ${key}`)
  },

  // Queue processing tracking
  trackQueueJob: (queue: string, jobId: string, duration: number) => {
    console.log(`QUEUE_PERF: ${queue}:${jobId} - ${duration}ms`)
  },
}
```

### Performance Dashboard
```typescript
// app/api/performance/metrics/route.ts
export async function GET(request: NextRequest) {
  try {
    const metrics = {
      database: await databaseHealthCheck(),
      redis: await redisHealthCheck(),
      queues: await queueHealthCheck(),
      api: await apiHealthCheck(),
    }

    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
```

## Performance Testing

### Load Testing Script
```typescript
// tests/performance/load-test.ts
import { performance } from 'perf_hooks'

export const loadTest = {
  // Test API endpoints under load
  testApiEndpoint: async (endpoint: string, concurrent: number = 10) => {
    const promises = Array(concurrent).fill(0).map(async () => {
      const start = performance.now()
      const response = await fetch(endpoint)
      const duration = performance.now() - start
      
      return {
        status: response.status,
        duration,
        success: response.ok,
      }
    })

    const results = await Promise.all(promises)
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
    const successRate = results.filter(r => r.success).length / results.length

    return {
      endpoint,
      concurrent,
      avgDuration,
      successRate,
      results,
    }
  },

  // Test database queries
  testDbQueries: async (queries: string[], iterations: number = 100) => {
    const results = []
    
    for (const query of queries) {
      const times = []
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now()
        await prisma.$queryRawUnsafe(query)
        const duration = performance.now() - start
        times.push(duration)
      }
      
      results.push({
        query,
        avgTime: times.reduce((sum, t) => sum + t, 0) / times.length,
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
      })
    }
    
    return results
  },
}
```

## Performance Checklist

### ✅ Database Optimization
- [ ] Implementerat eager loading för Prisma queries
- [ ] Lagt till databasindex för vanliga queries
- [ ] Optimerat connection pool settings
- [ ] Implementerat query pagination
- [ ] Lagt till database health monitoring

### ✅ Caching Strategy
- [ ] Implementerat Redis caching layer
- [ ] Lagt till cache invalidation strategies
- [ ] Implementerat cache hit/miss monitoring
- [ ] Optimerat cache TTL values
- [ ] Lagt till cache warming strategies

### ✅ Queue Optimization
- [ ] Ökat worker concurrency
- [ ] Implementerat parallel job processing
- [ ] Optimerat job retry strategies
- [ ] Lagt till queue monitoring
- [ ] Implementerat job prioritization

### ✅ API Optimization
- [ ] Implementerat response compression
- [ ] Lagt till API pagination
- [ ] Optimerat payload sizes
- [ ] Implementerat field selection
- [ ] Lagt till API response caching

### ✅ Frontend Optimization
- [ ] Implementerat code splitting
- [ ] Lagt till lazy loading
- [ ] Optimerat image loading
- [ ] Implementerat bundle optimization
- [ ] Lagt till performance monitoring

### ✅ Monitoring & Testing
- [ ] Implementerat performance metrics
- [ ] Lagt till load testing
- [ ] Implementerat performance dashboard
- [ ] Lagt till automated performance tests
- [ ] Implementerat alerting för performance issues

## Nästa Steg

1. **Implementera database optimeringar** - Eager loading, indexing, connection pooling
2. **Implementera caching strategy** - Redis caching med intelligent invalidation
3. **Optimera BullMQ workers** - Öka concurrency och parallel processing
4. **Implementera API optimeringar** - Pagination, compression, field selection
5. **Frontend performance** - Code splitting, lazy loading, image optimization
6. **Performance monitoring** - Metrics collection och dashboard
7. **Load testing** - Automatiserade performance tests

---

**Dokument version**: 1.0  
**Senast uppdaterad**: $(date)  
**Nästa granskning**: $(date -d "+1 month")
