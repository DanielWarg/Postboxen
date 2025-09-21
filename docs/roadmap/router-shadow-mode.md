# 🎯 Router Shadow-Mode Implementation

## 🚀 Shadow-Mode Flagga

```bash
# Router modes
ROUTER_MODE=shadow    # Logga val, påverka ej svar
ROUTER_MODE=live      # Normal operation
ROUTER_MODE=emergency # Force fast tier for all
```

## 📊 Shadow-Mode Metrics

- **Router Decision Logged**: Vilket val routern skulle gjort
- **Actual Model Used**: Vilken modell som faktiskt användes
- **Cost Comparison**: Kostnad shadow vs live
- **Latency Comparison**: Latens shadow vs live
- **Accuracy Comparison**: Kvalitet shadow vs live

## 🔧 Implementation

### 1. Router Mode Configuration

```typescript
// lib/ai/model-router.ts
export enum RouterMode {
  SHADOW = 'shadow',
  LIVE = 'live',
  EMERGENCY = 'emergency'
}

export interface RouterConfig {
  mode: RouterMode;
  canaryPercentage: number;
  budgetPerMeeting: number;
  defaultTier: 'fast' | 'balanced' | 'deep';
}

export function getRouterConfig(): RouterConfig {
  return {
    mode: (process.env.ROUTER_MODE as RouterMode) || RouterMode.LIVE,
    canaryPercentage: parseInt(process.env.ROUTER_CANARY_PERCENTAGE || '100'),
    budgetPerMeeting: parseFloat(process.env.ROUTER_BUDGET_PER_MEETING || '35'),
    defaultTier: (process.env.ROUTER_DEFAULT_TIER as 'fast' | 'balanced' | 'deep') || 'fast'
  };
}
```

### 2. Shadow-Mode Logic

```typescript
// lib/ai/model-router.ts
export async function selectModel(context: ModelContext): Promise<AiModel> {
  const config = getRouterConfig();
  
  // Emergency mode: force fast tier
  if (config.mode === RouterMode.EMERGENCY) {
    return getFastModel();
  }
  
  // Normal model selection logic
  const selectedModel = evaluatePolicy(context, config);
  
  // Shadow mode: log decision but don't use it
  if (config.mode === RouterMode.SHADOW) {
    await logShadowDecision(context, selectedModel);
    return getCurrentModel(); // Use existing model
  }
  
  // Live mode: use selected model
  return selectedModel;
}

async function logShadowDecision(context: ModelContext, selectedModel: AiModel) {
  const shadowLog = {
    timestamp: new Date().toISOString(),
    context: {
      meetingType: context.meetingType,
      urgency: context.urgency,
      tenantId: context.tenantId,
      estimatedCost: context.estimatedCost
    },
    selectedModel: {
      id: selectedModel.id,
      name: selectedModel.name,
      provider: selectedModel.provider,
      costPerToken: selectedModel.costPerToken
    },
    mode: 'shadow'
  };
  
  // Log to metrics system
  await agentMetrics.recordShadowDecision(shadowLog);
  
  // Log to structured logs
  logger.info('Router shadow decision', shadowLog);
}
```

### 3. Shadow-Mode Metrics

```typescript
// lib/observability/metrics.ts
export const agentMetrics = {
  // ... existing metrics ...
  
  recordShadowDecision(log: ShadowDecisionLog) {
    // Record shadow decision for analysis
    this.shadowDecisions.push(log);
    
    // Send to Prometheus
    this.prometheus.recordCounter('postboxen_router_shadow_decisions_total', {
      model: log.selectedModel.id,
      meeting_type: log.context.meetingType,
      urgency: log.context.urgency
    });
  },
  
  recordActualModelUsed(modelId: string, cost: number, latency: number) {
    // Record actual model usage
    this.prometheus.recordCounter('postboxen_router_actual_model_used_total', {
      model: modelId
    });
    
    this.prometheus.recordHistogram('postboxen_router_cost_bucket', cost, {
      model: modelId
    });
    
    this.prometheus.recordHistogram('postboxen_router_latency_bucket', latency, {
      model: modelId
    });
  }
};
```

### 4. Shadow-Mode Dashboard

```typescript
// app/agents/components/router-shadow-panel.tsx
export function RouterShadowPanel() {
  const [shadowData, setShadowData] = useState<ShadowDecisionLog[]>([]);
  const [actualData, setActualData] = useState<ActualModelUsage[]>([]);
  
  useEffect(() => {
    // Fetch shadow mode data
    fetch('/api/agents/router/shadow-data')
      .then(res => res.json())
      .then(data => setShadowData(data.shadowDecisions));
      
    // Fetch actual usage data
    fetch('/api/agents/router/actual-data')
      .then(res => res.json())
      .then(data => setActualData(data.actualUsage));
  }, []);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Router Shadow-Mode Analysis</h3>
      
      {/* Shadow vs Actual Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <h4 className="font-medium">Shadow Decisions</h4>
          <div className="text-2xl font-bold text-blue-600">
            {shadowData.length}
          </div>
          <div className="text-sm text-gray-600">
            Decisions logged in shadow mode
          </div>
        </div>
        
        <div className="p-4 border rounded">
          <h4 className="font-medium">Actual Usage</h4>
          <div className="text-2xl font-bold text-green-600">
            {actualData.length}
          </div>
          <div className="text-sm text-gray-600">
            Actual model usage
          </div>
        </div>
      </div>
      
      {/* Cost Comparison */}
      <div className="p-4 border rounded">
        <h4 className="font-medium mb-2">Cost Comparison</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Shadow Mode Cost:</span>
            <span className="font-mono">
              {calculateShadowCost(shadowData).toFixed(2)} SEK
            </span>
          </div>
          <div className="flex justify-between">
            <span>Actual Cost:</span>
            <span className="font-mono">
              {calculateActualCost(actualData).toFixed(2)} SEK
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Savings:</span>
            <span className="text-green-600">
              {(calculateShadowCost(shadowData) - calculateActualCost(actualData)).toFixed(2)} SEK
            </span>
          </div>
        </div>
      </div>
      
      {/* Latency Comparison */}
      <div className="p-4 border rounded">
        <h4 className="font-medium mb-2">Latency Comparison</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Shadow Mode p95:</span>
            <span className="font-mono">
              {calculateShadowLatencyP95(shadowData).toFixed(0)}ms
            </span>
          </div>
          <div className="flex justify-between">
            <span>Actual p95:</span>
            <span className="font-mono">
              {calculateActualLatencyP95(actualData).toFixed(0)}ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 5. Shadow-Mode API Endpoints

```typescript
// app/api/agents/router/shadow-data/route.ts
export async function GET(request: NextRequest) {
  try {
    const shadowDecisions = await getShadowDecisions();
    const actualUsage = await getActualModelUsage();
    
    return NextResponse.json({
      success: true,
      data: {
        shadowDecisions,
        actualUsage,
        comparison: {
          costSavings: calculateCostSavings(shadowDecisions, actualUsage),
          latencyImprovement: calculateLatencyImprovement(shadowDecisions, actualUsage),
          accuracyComparison: calculateAccuracyComparison(shadowDecisions, actualUsage)
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shadow data' }, { status: 500 });
  }
}
```

## 🎯 Shadow-Mode Benefits

### 1. Risk-Free Testing
- Testa nya router-logik utan att påverka användare
- Jämför kostnad och prestanda innan rollout
- Identifiera potentiella problem tidigt

### 2. Data-Driven Decisions
- Samla data om router-beslut över tid
- Analysera kostnadseffektivitet
- Optimera router-policyer baserat på verklig data

### 3. Gradual Rollout
- Börja med shadow-mode för alla
- Övervaka metrics och feedback
- Gradvis öka canary-percentage

### 4. Emergency Fallback
- Emergency mode förcerar fast tier
- Säkerställer systemstabilitet vid problem
- Ger tid att fixa router-problem

---

**Shadow-mode gör router-rollout säker och datadriven!** 🚀
