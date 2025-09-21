# Regwatch Push: Relevansmatch + Post-brief Integration

## 🎯 Mål
Relevansfilter + "friendly diff" i Post-brief när något rör mötets ämnen.
Tysta irrelevanta träffar.

## 📋 Acceptance Criteria
- [ ] Relevansfilter som matchar mötets ämnen mot regeländringar
- [ ] "Friendly diff" som visar ändringar på ett begripligt sätt
- [ ] Post-brief integration med relevanta regeländringar
- [ ] Tysta irrelevanta träffar baserat på relevansscore
- [ ] Push-notifikationer för kritiska ändringar

## 🔧 Implementation Plan

### 1. Relevance Engine
```typescript
// lib/modules/regwatch/relevance-engine.ts
export class RelevanceEngine {
  async calculateRelevance(meetingTopics: string[], regulation: Regulation): Promise<RelevanceScore>;
  async filterRelevantChanges(changes: RegulationChange[], threshold: number): Promise<RegulationChange[]>;
  async generateFriendlyDiff(change: RegulationChange): Promise<FriendlyDiff>;
}

interface RelevanceScore {
  score: number; // 0-1
  reasons: string[];
  keywords: string[];
  meetingTopics: string[];
}

interface FriendlyDiff {
  summary: string;
  before: string;
  after: string;
  impact: string;
  actionRequired: boolean;
  deadline?: Date;
}
```

### 2. Meeting Topic Extraction
```typescript
// lib/modules/regwatch/topic-extractor.ts
export class TopicExtractor {
  async extractTopics(meetingContent: string): Promise<string[]>;
  async extractKeywords(transcript: string): Promise<string[]>;
  async categorizeTopics(topics: string[]): Promise<TopicCategory[]>;
}

interface TopicCategory {
  category: string;
  topics: string[];
  confidence: number;
  regulations: string[];
}
```

### 3. Post-brief Integration
```typescript
// lib/modules/regwatch/post-brief-integration.ts
export class PostBriefIntegration {
  async generateRegulationSection(relevantChanges: RegulationChange[]): Promise<string>;
  async formatFriendlyDiff(diff: FriendlyDiff): Promise<string>;
  async addToPostBrief(brief: MeetingBrief, changes: RegulationChange[]): Promise<MeetingBrief>;
}
```

### 4. Push Notification System
```typescript
// lib/modules/regwatch/push-notifications.ts
export class PushNotificationService {
  async sendCriticalChangeNotification(change: RegulationChange, meeting: Meeting): Promise<void>;
  async sendWeeklyDigest(userId: string, changes: RegulationChange[]): Promise<void>;
  async sendDeadlineReminder(change: RegulationChange): Promise<void>;
}
```

### 5. UI Components
```typescript
// app/agents/components/regwatch-push-card.tsx
interface RegwatchPushCardProps {
  relevantChanges: RegulationChange[];
  meetingTopics: string[];
  onViewDetails: (change: RegulationChange) => void;
  onDismiss: (changeId: string) => void;
}

// app/agents/components/friendly-diff.tsx
interface FriendlyDiffProps {
  diff: FriendlyDiff;
  onViewFullText: () => void;
  onSetReminder: (deadline: Date) => void;
}
```

### 6. API Endpoints
```typescript
// app/api/agents/regwatch/relevance/route.ts
export async function POST(request: NextRequest) {
  // Calculate relevance for meeting topics
}

// app/api/agents/regwatch/push/route.ts
export async function POST(request: NextRequest) {
  // Send push notifications for relevant changes
}

// app/api/agents/regwatch/friendly-diff/route.ts
export async function POST(request: NextRequest) {
  // Generate friendly diff for regulation change
}
```

### 7. Database Schema Updates
```sql
-- Relevance scores
CREATE TABLE "RegulationRelevance" (
  "id" TEXT PRIMARY KEY,
  "meetingId" TEXT NOT NULL,
  "regulationId" TEXT NOT NULL,
  "relevanceScore" DECIMAL(3,2) NOT NULL,
  "reasons" JSONB NOT NULL,
  "keywords" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Push notifications
CREATE TABLE "RegulationPushNotification" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "regulationId" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- 'critical', 'weekly', 'deadline'
  "sentAt" TIMESTAMP,
  "readAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Topic categories
CREATE TABLE "MeetingTopicCategory" (
  "id" TEXT PRIMARY KEY,
  "meetingId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "topics" TEXT[] NOT NULL,
  "confidence" DECIMAL(3,2) NOT NULL,
  "regulations" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🧪 Tests
- [ ] Unit tests för RelevanceEngine
- [ ] Unit tests för TopicExtractor
- [ ] Unit tests för PostBriefIntegration
- [ ] Integration tests för push notifications
- [ ] E2E tests för regwatch push flow
- [ ] Performance tests för relevance calculation

## 📊 Success Metrics
- Relevance accuracy: % korrekta relevansbedömningar
- User engagement: % användare som läser regwatch-push
- False positive rate: % irrelevanta träffar som filtreras bort
- Time to relevance: tid för relevansberäkning

## 🔗 Related Issues
- Regulation change tracking
- Meeting topic analysis
- Post-brief generation
- Push notification system
