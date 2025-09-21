# 🚀 Superkoncis nästa-steg-plan: MVP → Awesome i produktion

## 1) Släpp live i liten canary (idag)

### ✅ Degrade Mode: PÅ (redan)
```bash
FEATURE_DEGRADE_MODE=1  # Redan aktiverat
```

### ✅ Router: `ROUTER_MODE=shadow` 24h → sätt 10% canary (tenant-tag)
```bash
ROUTER_MODE=shadow
ROUTER_CANARY_PERCENTAGE=10
ROUTER_CANARY_TENANT_TAGS=canary,beta,early-adopter
```

### ✅ Decision-Close Card: aktivera för 1 pilot (staging ok) → mål: *decision coverage = 100%*
```bash
FEATURE_DECISION_CLOSE_CARD=1
DECISION_CLOSE_PILOT_TENANTS=pilot-a,pilot-b
```

### ✅ Regwatch Push: staging→prod för approved källor
```bash
FEATURE_REGWATCH_PUSH=1
REGWATCH_APPROVED_SOURCES=eu-commission,swedish-government,gdpr-updates
```

### ✅ Doc-Copilot v1: dark-launch internt
```bash
FEATURE_DOC_COPILOT_V1=1
DOC_COPILOT_DARK_LAUNCH=true
DOC_COPILOT_INTERNAL_ONLY=true
```

---

## 2) Operativa vaktposter (första 24–48h)

### 🚨 Kritiska KPI:er att övervaka

* **Join success p95 ≥ 99%** (alert <98%)
* **Recap p95 < 90s** (alert >120s → router "fast")
* **Felrate < 0.5%** (alert >1% → stoppa "deep")
* **Kostnad/möte ≤ 30–35 kr** (alert >35 → sänk budgettak)
* **Decision coverage = 100%** vid mötesslut

### 📊 Dashboard Panels att övervaka

1. **Join Success Rate** - måste vara ≥ 99%
2. **Recap Latency p95** - måste vara < 90s
3. **Error Rate** - måste vara < 0.5%
4. **Cost per Meeting** - måste vara ≤ 35 SEK
5. **Decision Coverage** - måste vara 100%

---

## 3) Snabbval: "stop the bleeding"

### 🚨 Kill-Switch Commands

* **Router dyker?** → `FEATURE_MODEL_ROUTER=0`
* **Join strular?** → `FEATURE_DEGRADE_MODE=1` (redan PÅ)
* **Regwatch brus?** → höj relevans-tröskel / visa endast approved

### 🔧 Emergency Procedures

```bash
# Immediate rollback
FEATURE_MODEL_ROUTER=0
FEATURE_DECISION_CLOSE_CARD=0
FEATURE_DOC_COPILOT_V1=0
FEATURE_REGWATCH_PUSH=0
FEATURE_DEGRADE_MODE=1  # keep safety net

# Router emergency
ROUTER_MODE=emergency
ROUTER_DEFAULT_TIER=fast
ROUTER_BUDGET_PER_MEETING=5

# Regwatch emergency
REGWATCH_RELEVANCE_THRESHOLD=0.9
REGWATCH_APPROVED_SOURCES_ONLY=true
```

---

## 4) Vecka 1: bevisa värdet (två piloter)

### 🎯 Pilot A (SMB/upphandling)
- **Mål**: *48h completion ≥ 70%*
- **Fokus**: 2–3 upphandlingscase med konkreta förslag
- **Mätpunkter**: Decision coverage, task completion, cost per meeting

### 🎯 Pilot B (konsult/leverans)
- **Mål**: *sparad tid ≥ 25 min/möte*
- **Fokus**: Kostnad/möte ≤ 30 kr
- **Mätpunkter**: Time saved, cost efficiency, user satisfaction

### 📝 Samla 5 "aha-ögonblick" (citat) → case på landningssidan
- Användarfeedback om sparad tid
- Konkreta exempel på förbättringar
- ROI-beräkningar
- Testimonials från piloter

---

## 5) Vecka 2–3: höj ribban

### 🚀 Skala Router till 50% → 100% om alertar är gröna
```bash
# Vecka 2: 50% rollout
ROUTER_CANARY_PERCENTAGE=50

# Vecka 3: 100% rollout (om metrics är gröna)
ROUTER_CANARY_PERCENTAGE=100
ROUTER_MODE=live
```

### 🚀 Rulla Decision-Close bredare när *coverage > 95%* i pilot
```bash
# Vecka 2: 50% rollout
DECISION_CLOSE_CANARY_PERCENTAGE=50

# Vecka 3: 100% rollout (om coverage > 95%)
DECISION_CLOSE_CANARY_PERCENTAGE=100
```

### 🚀 Lägg till Budget UI (visa förbrukning före/during/efter möte)
- Pre-meeting budget estimate
- Real-time cost tracking during meeting
- Post-meeting cost summary
- Budget alerts and recommendations

---

## 6) Vecka 4: försäljning & paketering

### 🛒 Modulshop: "Gunnar (Juridik)", Regwatch Plus, Doc-Copilot Pro
- **Bas**: Recap + basic actions
- **Plus**: Actions + nudges + Regwatch
- **Pro**: Full Regwatch + Doc-Copilot + advanced features

### 💰 Pris: Bas (recap), Plus (actions+nudges), Pro (regwatch+copilot)
- **Bas**: 299 SEK/månad per användare
- **Plus**: 599 SEK/månad per användare
- **Pro**: 999 SEK/månad per användare

### 📋 DPA/DPIA bilagor + enkel IT-guide (scopes, databoende, retention)
- Data Processing Agreement (DPA)
- Data Protection Impact Assessment (DPIA)
- IT-guide för scopes och databoende
- Retention policy dokumentation

---

## 7) Snabb smoke-kommandon (hands-on)

### ✅ Tester: `pnpm test:ci && pnpm test:e2e`
```bash
# Run all tests
pnpm test:ci
pnpm test:e2e

# Verify test coverage
pnpm test:coverage
```

### ✅ Migrations: `pnpm exec prisma migrate deploy`
```bash
# Deploy migrations
pnpm exec prisma migrate deploy

# Verify database health
pnpm exec prisma db status
```

### ✅ Workers: starta/validera BullMQ health (queue depth ~ 0, DLQ = 0)
```bash
# Start workers
pnpm run workers:start

# Check queue health
curl http://localhost:3000/api/agents/queues/stats

# Verify DLQ is empty
curl http://localhost:3000/api/agents/queues/dead-letter
```

### ✅ Retention sweep (staging): kör cron manuellt och kontrollera audit
```bash
# Run retention sweep manually
pnpm run retention:sweep

# Check audit logs
curl http://localhost:3000/api/agents/audit
```

---

## 8) "Definition of Awesome" (målen vi stänger på)

### 🎯 Hårda mål att uppnå

* **≥ 25 min** sparad tid/möte
* **≥ 70%** actions klara inom 48h
* **100%** beslut har ägare+deadline vid mötesslut
* **≤ 30–35 kr** kostnad/möte
* **0 blockerande fel** (degrade räddar upp)

### 📊 KPI Dashboard

1. **Time Saved per Meeting**: Mål ≥ 25 min
2. **48h Action Completion**: Mål ≥ 70%
3. **Decision Coverage**: Mål 100%
4. **Cost per Meeting**: Mål ≤ 35 SEK
5. **Zero Blocking Errors**: Mål 0 (degrade mode active)

---

## 🎯 Kanarystyrning per tenant-tag

### 🔧 Tenant Tag Management

```typescript
// lib/features/tenant-tags.ts
export interface TenantTag {
  id: string;
  name: string;
  description: string;
  features: string[];
  canaryPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export const TENANT_TAGS = {
  CANARY: 'canary',
  BETA: 'beta',
  EARLY_ADOPTER: 'early-adopter',
  PILOT_A: 'pilot-a',
  PILOT_B: 'pilot-b',
  INTERNAL: 'internal'
} as const;

export function getTenantFeatures(tenantId: string): string[] {
  const tags = getTenantTags(tenantId);
  const features: string[] = [];
  
  for (const tag of tags) {
    const tagConfig = getTagConfig(tag);
    features.push(...tagConfig.features);
  }
  
  return [...new Set(features)]; // Remove duplicates
}

export function isFeatureEnabledForTenant(tenantId: string, feature: string): boolean {
  const tenantFeatures = getTenantFeatures(tenantId);
  return tenantFeatures.includes(feature);
}
```

### 🎛️ Admin UI för Feature Flags

```typescript
// app/agents/components/admin/feature-flags-panel.tsx
export function FeatureFlagsPanel() {
  const [tenantTags, setTenantTags] = useState<TenantTag[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  
  const updateTenantTag = async (tagId: string, updates: Partial<TenantTag>) => {
    await fetch(`/api/admin/tenant-tags/${tagId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    // Refresh data
    fetchTenantTags();
  };
  
  const toggleFeatureForTag = async (tagId: string, feature: string, enabled: boolean) => {
    const tag = tenantTags.find(t => t.id === tagId);
    if (!tag) return;
    
    const updatedFeatures = enabled 
      ? [...tag.features, feature]
      : tag.features.filter(f => f !== feature);
    
    await updateTenantTag(tagId, { features: updatedFeatures });
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Feature Flags per Tenant Tag</h2>
      
      {tenantTags.map(tag => (
        <div key={tag.id} className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{tag.name}</h3>
              <p className="text-sm text-gray-600">{tag.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Canary:</span>
              <input
                type="number"
                value={tag.canaryPercentage}
                onChange={(e) => updateTenantTag(tag.id, { 
                  canaryPercentage: parseInt(e.target.value) 
                })}
                className="w-20 px-2 py-1 border rounded"
                min="0"
                max="100"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {featureFlags.map(flag => (
              <div key={flag.id} className="flex items-center gap-2">
                <Switch
                  checked={tag.features.includes(flag.id)}
                  onCheckedChange={(checked) => 
                    toggleFeatureForTag(tag.id, flag.id, checked)
                  }
                />
                <span className="text-sm">{flag.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 🔧 API Endpoints för Tenant Tag Management

```typescript
// app/api/admin/tenant-tags/route.ts
export async function GET() {
  const tenantTags = await getTenantTags();
  return NextResponse.json({ success: true, data: tenantTags });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newTag = await createTenantTag(body);
  return NextResponse.json({ success: true, data: newTag });
}

// app/api/admin/tenant-tags/[tagId]/route.ts
export async function PATCH(request: NextRequest, { params }: { params: { tagId: string } }) {
  const body = await request.json();
  const updatedTag = await updateTenantTag(params.tagId, body);
  return NextResponse.json({ success: true, data: updatedTag });
}

export async function DELETE(request: NextRequest, { params }: { params: { tagId: string } }) {
  await deleteTenantTag(params.tagId);
  return NextResponse.json({ success: true });
}
```

---

**Denna plan tar er från stabil MVP till awesome i produktion utan drama!** 🚀
