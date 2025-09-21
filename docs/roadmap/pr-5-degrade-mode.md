# Degrade Mode: Vid Join-fel → Efterhandsanalys utan manuell insats

## 🎯 Mål
Vid join-fel → efterhandsanalys utan manuell insats.
Auto-degradera till efterhandsanalys när live-join misslyckas.

## 📋 Acceptance Criteria
- [ ] Auto-detektera join-fel i möten
- [ ] Degradera till efterhandsanalys när live-join misslyckas
- [ ] Efterhandsanalys utan manuell insats
- [ ] Fallback-strategier för olika feltyper
- [ ] Monitoring och alerting för degrade-events
- [ ] Recovery-strategier för att återgå till live-mode

## 🔧 Implementation Plan

### 1. Join Failure Detection
```typescript
// lib/modules/degrade-mode/join-detector.ts
export class JoinFailureDetector {
  async detectJoinFailure(meeting: Meeting): Promise<JoinFailureResult>;
  async classifyFailureType(error: Error): Promise<FailureType>;
  async shouldDegrade(failure: JoinFailureResult): Promise<boolean>;
}

interface JoinFailureResult {
  hasFailed: boolean;
  failureType: FailureType;
  error: Error;
  timestamp: Date;
  retryCount: number;
  canRetry: boolean;
}

enum FailureType {
  NETWORK_ERROR = 'network_error',
  AUTHENTICATION_ERROR = 'auth_error',
  PERMISSION_ERROR = 'permission_error',
  API_ERROR = 'api_error',
  TIMEOUT_ERROR = 'timeout_error',
  UNKNOWN_ERROR = 'unknown_error'
}
```

### 2. Degrade Mode Engine
```typescript
// lib/modules/degrade-mode/degrade-engine.ts
export class DegradeEngine {
  async initiateDegradeMode(meeting: Meeting, reason: string): Promise<DegradeResult>;
  async schedulePostAnalysis(meeting: Meeting): Promise<void>;
  async executePostAnalysis(meeting: Meeting): Promise<AnalysisResult>;
  async attemptRecovery(meeting: Meeting): Promise<RecoveryResult>;
}

interface DegradeResult {
  success: boolean;
  degradeMode: DegradeMode;
  scheduledAnalysis: Date;
  recoveryAttempts: number;
  estimatedCompletion: Date;
}

enum DegradeMode {
  POST_ANALYSIS = 'post_analysis',
  MANUAL_REVIEW = 'manual_review',
  RETRY_SCHEDULED = 'retry_scheduled',
  FAILED = 'failed'
}
```

### 3. Post-Analysis Engine
```typescript
// lib/modules/degrade-mode/post-analysis.ts
export class PostAnalysisEngine {
  async analyzeMeetingRecording(meeting: Meeting): Promise<PostAnalysisResult>;
  async generateRecapFromRecording(recording: string): Promise<RecapResult>;
  async extractDecisionsFromRecording(recording: string): Promise<Decision[]>;
  async generateActionItemsFromRecording(recording: string): Promise<ActionItem[]>;
}

interface PostAnalysisResult {
  success: boolean;
  recap: RecapResult;
  decisions: Decision[];
  actionItems: ActionItem[];
  quality: 'high' | 'medium' | 'low';
  confidence: number;
  processingTime: number;
}

interface RecapResult {
  summary: string;
  keyPoints: string[];
  participants: string[];
  duration: number;
  quality: number;
}
```

### 4. Recovery System
```typescript
// lib/modules/degrade-mode/recovery-system.ts
export class RecoverySystem {
  async attemptRecovery(meeting: Meeting): Promise<RecoveryResult>;
  async scheduleRetry(meeting: Meeting, delay: number): Promise<void>;
  async checkSystemHealth(): Promise<SystemHealth>;
  async notifyRecovery(meeting: Meeting): Promise<void>;
}

interface RecoveryResult {
  success: boolean;
  method: RecoveryMethod;
  nextAttempt?: Date;
  permanentFailure: boolean;
}

enum RecoveryMethod {
  IMMEDIATE_RETRY = 'immediate_retry',
  SCHEDULED_RETRY = 'scheduled_retry',
  MANUAL_INTERVENTION = 'manual_intervention',
  SYSTEM_RECOVERY = 'system_recovery'
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  components: ComponentHealth[];
  lastCheck: Date;
}

interface ComponentHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  errorRate: number;
}
```

### 5. Monitoring & Alerting
```typescript
// lib/modules/degrade-mode/monitoring.ts
export class DegradeMonitoring {
  async trackDegradeEvent(event: DegradeEvent): Promise<void>;
  async generateDegradeReport(period: DateRange): Promise<DegradeReport>;
  async sendAlert(alert: DegradeAlert): Promise<void>;
  async updateMetrics(metrics: DegradeMetrics): Promise<void>;
}

interface DegradeEvent {
  meetingId: string;
  failureType: FailureType;
  degradeMode: DegradeMode;
  timestamp: Date;
  duration: number;
  recoveryTime?: number;
  success: boolean;
}

interface DegradeReport {
  period: DateRange;
  totalEvents: number;
  successRate: number;
  averageRecoveryTime: number;
  failureBreakdown: FailureBreakdown[];
  trends: DegradeTrend[];
}

interface DegradeAlert {
  type: 'degrade_initiated' | 'recovery_failed' | 'system_critical';
  meetingId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}
```

### 6. UI Components
```typescript
// app/agents/components/degrade-status.tsx
interface DegradeStatusProps {
  meeting: Meeting;
  degradeMode: DegradeMode;
  recoveryAttempts: number;
  estimatedCompletion: Date;
  onRetry: () => void;
  onViewDetails: () => void;
}

// app/agents/components/post-analysis-progress.tsx
interface PostAnalysisProgressProps {
  meeting: Meeting;
  progress: number;
  status: string;
  estimatedTime: number;
  onCancel: () => void;
}

// app/agents/components/recovery-panel.tsx
interface RecoveryPanelProps {
  meeting: Meeting;
  recoveryResult: RecoveryResult;
  onRetry: () => void;
  onScheduleRetry: (delay: number) => void;
}
```

### 7. API Endpoints
```typescript
// app/api/agents/degrade-mode/initiate/route.ts
export async function POST(request: NextRequest) {
  // Initiate degrade mode for meeting
}

// app/api/agents/degrade-mode/recovery/route.ts
export async function POST(request: NextRequest) {
  // Attempt recovery from degrade mode
}

// app/api/agents/degrade-mode/status/route.ts
export async function GET(request: NextRequest) {
  // Get degrade mode status
}

// app/api/agents/degrade-mode/analysis/route.ts
export async function POST(request: NextRequest) {
  // Execute post-analysis
}
```

### 8. Database Schema
```sql
-- Degrade events
CREATE TABLE "DegradeEvent" (
  "id" TEXT PRIMARY KEY,
  "meetingId" TEXT NOT NULL,
  "failureType" TEXT NOT NULL,
  "degradeMode" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "duration" INTEGER,
  "recoveryTime" INTEGER,
  "success" BOOLEAN NOT NULL,
  "retryCount" INTEGER DEFAULT 0
);

-- Post-analysis results
CREATE TABLE "PostAnalysisResult" (
  "id" TEXT PRIMARY KEY,
  "meetingId" TEXT NOT NULL,
  "recap" TEXT NOT NULL,
  "decisions" JSONB NOT NULL,
  "actionItems" JSONB NOT NULL,
  "quality" TEXT NOT NULL,
  "confidence" DECIMAL(3,2) NOT NULL,
  "processingTime" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recovery attempts
CREATE TABLE "RecoveryAttempt" (
  "id" TEXT PRIMARY KEY,
  "meetingId" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "attemptedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "nextAttempt" TIMESTAMP,
  "permanentFailure" BOOLEAN DEFAULT false
);

-- System health
CREATE TABLE "SystemHealth" (
  "id" TEXT PRIMARY KEY,
  "component" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "responseTime" INTEGER,
  "errorRate" DECIMAL(3,2),
  "checkedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🧪 Tests
- [ ] Unit tests för JoinFailureDetector
- [ ] Unit tests för DegradeEngine
- [ ] Unit tests för PostAnalysisEngine
- [ ] Unit tests för RecoverySystem
- [ ] Integration tests för degrade mode flow
- [ ] E2E tests för recovery scenarios
- [ ] Load tests för post-analysis performance

## 📊 Success Metrics
- Degrade success rate: % möten som hanteras i degrade mode
- Recovery success rate: % möten som återhämtar sig
- Post-analysis quality: kvalitet på efterhandsanalys
- Time to recovery: tid för återhämtning från degrade mode

## 🔗 Related Issues
- Join failure handling
- Post-analysis quality
- Recovery strategies
- System health monitoring
