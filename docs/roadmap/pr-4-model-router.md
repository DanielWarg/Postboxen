# Model Router: Policy + Budget per Möte + Kostnadsindikator

## 🎯 Mål
Snabb/billig recap-modell, djupanalys on-demand.
Budget per möte/tenant + kostnadsindikator i UI.

## 📋 Acceptance Criteria
- [ ] Model routing policy baserat på mötetyp och komplexitet
- [ ] Budget per möte/tenant med kostnadstak
- [ ] Kostnadsindikator i UI (tokens/kostnad per möte)
- [ ] Snabb/billig recap-modell för enkla möten
- [ ] Djupanalys on-demand för komplexa möten
- [ ] Auto-degradering vid budgetöverskridning

## 🔧 Implementation Plan

### 1. Model Router Engine
```typescript
// lib/modules/model-router/router.ts
export class ModelRouter {
  async selectModel(meeting: Meeting, budget: Budget): Promise<ModelSelection>;
  async calculateCost(input: string, model: string): Promise<CostEstimate>;
  async checkBudget(tenantId: string, cost: number): Promise<BudgetStatus>;
}

interface ModelSelection {
  model: string;
  reason: string;
  estimatedCost: number;
  quality: 'fast' | 'balanced' | 'deep';
  fallbackModel?: string;
}

interface CostEstimate {
  tokens: number;
  cost: number;
  currency: string;
  model: string;
  timestamp: Date;
}

interface BudgetStatus {
  remaining: number;
  used: number;
  limit: number;
  canProceed: boolean;
  warningThreshold: number;
}
```

### 2. Budget Management
```typescript
// lib/modules/model-router/budget-manager.ts
export class BudgetManager {
  async getTenantBudget(tenantId: string): Promise<TenantBudget>;
  async updateBudget(tenantId: string, amount: number): Promise<void>;
  async checkMeetingBudget(meetingId: string, estimatedCost: number): Promise<boolean>;
  async recordCost(meetingId: string, actualCost: number): Promise<void>;
}

interface TenantBudget {
  tenantId: string;
  monthlyLimit: number;
  usedThisMonth: number;
  perMeetingLimit: number;
  warningThreshold: number;
  autoDegrade: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Model Configuration
```typescript
// lib/modules/model-router/model-config.ts
export class ModelConfig {
  async getAvailableModels(): Promise<Model[]>;
  async getModelCapabilities(modelId: string): Promise<ModelCapabilities>;
  async updateModelPolicy(policy: ModelPolicy): Promise<void>;
}

interface Model {
  id: string;
  name: string;
  provider: string;
  costPerToken: number;
  maxTokens: number;
  capabilities: string[];
  quality: 'fast' | 'balanced' | 'deep';
}

interface ModelCapabilities {
  maxTokens: number;
  languages: string[];
  features: string[];
  latency: number;
  accuracy: number;
}

interface ModelPolicy {
  tenantId: string;
  defaultModel: string;
  fallbackModel: string;
  budgetLimits: BudgetLimits;
  qualityThresholds: QualityThresholds;
}
```

### 4. Cost Tracking
```typescript
// lib/modules/model-router/cost-tracker.ts
export class CostTracker {
  async trackMeetingCost(meetingId: string, cost: CostEstimate): Promise<void>;
  async getTenantCosts(tenantId: string, period: DateRange): Promise<CostSummary>;
  async getMeetingCosts(meetingId: string): Promise<CostBreakdown>;
  async generateCostReport(tenantId: string): Promise<CostReport>;
}

interface CostSummary {
  totalCost: number;
  meetingCount: number;
  averageCostPerMeeting: number;
  modelBreakdown: ModelCostBreakdown[];
  period: DateRange;
}

interface CostBreakdown {
  meetingId: string;
  totalCost: number;
  recapCost: number;
  analysisCost: number;
  briefingCost: number;
  modelUsed: string;
  tokensUsed: number;
}
```

### 5. UI Components
```typescript
// app/agents/components/cost-indicator.tsx
interface CostIndicatorProps {
  meetingId: string;
  estimatedCost: number;
  actualCost?: number;
  budget: BudgetStatus;
  onViewDetails: () => void;
}

// app/agents/components/budget-panel.tsx
interface BudgetPanelProps {
  tenantId: string;
  budget: TenantBudget;
  onUpdateBudget: (amount: number) => void;
  onViewReport: () => void;
}

// app/agents/components/model-selector.tsx
interface ModelSelectorProps {
  meeting: Meeting;
  availableModels: Model[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  costEstimate: CostEstimate;
}
```

### 6. API Endpoints
```typescript
// app/api/agents/model-router/select/route.ts
export async function POST(request: NextRequest) {
  // Select optimal model for meeting
}

// app/api/agents/model-router/cost/route.ts
export async function POST(request: NextRequest) {
  // Calculate cost estimate
}

// app/api/agents/model-router/budget/route.ts
export async function GET(request: NextRequest) {
  // Get tenant budget status
}

// app/api/agents/model-router/budget/route.ts
export async function PUT(request: NextRequest) {
  // Update tenant budget
}
```

### 7. Database Schema
```sql
-- Model configurations
CREATE TABLE "Model" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "costPerToken" DECIMAL(10,6) NOT NULL,
  "maxTokens" INTEGER NOT NULL,
  "capabilities" JSONB NOT NULL,
  "quality" TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenant budgets
CREATE TABLE "TenantBudget" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "monthlyLimit" DECIMAL(10,2) NOT NULL,
  "usedThisMonth" DECIMAL(10,2) DEFAULT 0,
  "perMeetingLimit" DECIMAL(10,2) NOT NULL,
  "warningThreshold" DECIMAL(3,2) DEFAULT 0.8,
  "autoDegrade" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost tracking
CREATE TABLE "MeetingCost" (
  "id" TEXT PRIMARY KEY,
  "meetingId" TEXT NOT NULL,
  "modelId" TEXT NOT NULL,
  "tokensUsed" INTEGER NOT NULL,
  "cost" DECIMAL(10,2) NOT NULL,
  "currency" TEXT DEFAULT 'SEK',
  "costType" TEXT NOT NULL, -- 'recap', 'analysis', 'briefing'
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Model policies
CREATE TABLE "ModelPolicy" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "defaultModel" TEXT NOT NULL,
  "fallbackModel" TEXT NOT NULL,
  "budgetLimits" JSONB NOT NULL,
  "qualityThresholds" JSONB NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🧪 Tests
- [ ] Unit tests för ModelRouter
- [ ] Unit tests för BudgetManager
- [ ] Unit tests för CostTracker
- [ ] Integration tests för model selection
- [ ] E2E tests för budget management
- [ ] Performance tests för cost calculation

## 📊 Success Metrics
- Cost per meeting: genomsnittlig kostnad per möte
- Budget adherence: % möten inom budget
- Model selection accuracy: % korrekt modellval
- User satisfaction: kostnadsindikator användbarhet

## 🔗 Related Issues
- Model selection optimization
- Budget management
- Cost tracking and reporting
- Auto-degradation on budget limits
