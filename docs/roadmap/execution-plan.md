# 🚀 Kompakt Exekveringsplan: 5 PR:er till Production

## 📋 Merge-gates (gäller alla 5 PR)

### ✅ Feature Flag
- [ ] Feature flag på (default: **off** i prod, **on** i staging)
- [ ] Rollback-switch dokumenterad och testad
- [ ] Canary-rollout plan (10% → 50% → 100%)

### ✅ Migrations & Backout
- [ ] Migrations körda i staging
- [ ] Backout-plan finns (down-migration eller soft-delete)
- [ ] Database backup innan migration

### ✅ Telemetri & Observability
- [ ] Events skickas (success/fail/latens/kostnad)
- [ ] Dashboards uppdaterade med nya metrics
- [ ] Alerting-regler konfigurerade

### ✅ Tests
- [ ] Unit + integration + E2E grönt
- [ ] Täcker "glad väg" och minst 1 felväg
- [ ] Performance tests för nya features

### ✅ Security & Privacy
- [ ] Inga extra scopes utan motivering
- [ ] Loggar saknar PII
- [ ] Audit event skapas för alla actions

---

## 🎯 PR #1 – Decision-Close Card

### Acceptance Criteria
- [ ] 100% av öppna beslut har **ägare + deadline** innan mötet stängs
- [ ] Adaptive Card funkar i Teams/Zoom
- [ ] Fallback till post-brief om kortet avvisas/ignoreras
- [ ] Skapar uppgifter i Planner/Jira/Trello med idempotens

### Mätpunkter
```typescript
// Telemetri events
decision_close_shown: { meetingId, decisionCount, timestamp }
decision_close_submitted: { meetingId, decisions: Decision[], timestamp }
decision_close_skipped: { meetingId, reason, timestamp }
task_create_ok: { provider, taskId, decisionId, timestamp }
task_create_fail: { provider, error, decisionId, timestamp }
```

### Tester
- [ ] API: skapa/uppdatera beslut → router till vald provider
- [ ] E2E: simulera mötesstängning → kort → uppgift skapad → kvittens i audit
- [ ] Idempotens: samma beslut skapas inte dubbelt

### Database Schema
```sql
ALTER TABLE "DecisionCard" ADD COLUMN "ownerEmail" TEXT;
ALTER TABLE "DecisionCard" ADD COLUMN "deadline" TIMESTAMP;
ALTER TABLE "DecisionCard" ADD COLUMN "externalTaskId" TEXT;
ALTER TABLE "DecisionCard" ADD COLUMN "externalPlatform" TEXT;
```

---

## 🎯 PR #2 – Doc-Copilot v1

### Acceptance Criteria
- [ ] Sidopanel visar **diff** (före/efter) på stycken
- [ ] Varje förslag har **källcitat**
- [ ] "Infoga i dokument" skriver till doc-lagret eller exporterar patch
- [ ] PII-maskning respekteras; ingen text lämnar EU-region

### Mätpunkter
```typescript
doccopilot_open: { meetingId, documentType, timestamp }
suggestion_rendered: { meetingId, suggestionCount, timestamp }
suggestion_accepted: { meetingId, suggestionId, timestamp }
suggestion_rejected: { meetingId, suggestionId, reason, timestamp }
insert_done: { meetingId, documentId, timestamp }
```

### Tester
- [ ] Unit: diff-motor (insertion/deletion/replace), citations mappar rätt
- [ ] E2E: öppna panel, acceptera 1 förslag, se diff + audit-spår
- [ ] PII-maskning: ingen känslig data i logs

### Database Schema
```sql
CREATE TABLE "DocumentAnalysis" (
  "id" TEXT PRIMARY KEY,
  "meetingId" TEXT NOT NULL,
  "originalContent" TEXT NOT NULL,
  "suggestedContent" TEXT,
  "analysisResult" JSONB NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎯 PR #3 – Regwatch Push

### Acceptance Criteria
- [ ] Minst 1 relevant notis visas i post-brief när källor matchar mötets ämnen
- [ ] **Irrelevanta tystas** baserat på relevansscore
- [ ] Varje notis har **källa + datum + friendly-diff** och länk till full historik

### Mätpunkter
```typescript
regwatch_candidate: { meetingId, regulationId, score, timestamp }
regwatch_relevant: { meetingId, regulationId, score, timestamp }
regwatch_postbrief_shown: { meetingId, regulationCount, timestamp }
regwatch_ctr: { regulationId, clicks, impressions, timestamp }
```

### Tester
- [ ] Jobb: pipeline med dedup/relevansscore > tröskel
- [ ] E2E: så in en matchande "förändring" → kontrollera att den dyker upp i post-brief
- [ ] Relevansfilter: irrelevanta träffar filtreras bort

### Database Schema
```sql
CREATE TABLE "RegulationRelevance" (
  "id" TEXT PRIMARY KEY,
  "meetingId" TEXT NOT NULL,
  "regulationId" TEXT NOT NULL,
  "relevanceScore" DECIMAL(3,2) NOT NULL,
  "reasons" JSONB NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎯 PR #4 – Model Router

### Acceptance Criteria
- [ ] Policy per tenant/mötestyp: snabb/billig recap-modell, djupanalys on-demand
- [ ] **Budgettak** per möte/tenant; när tak nås → lägre kostnadsprofil eller avbryt
- [ ] Kostnad/möte visas i Observability-panelen

### Mätpunkter
```typescript
router_decision: { meetingId, model, cost, tokens, timestamp }
budget_hit: { tenantId, meetingId, limit, actual, timestamp }
downgrade_applied: { meetingId, fromModel, toModel, reason, timestamp }
router_latency_p95: { model, latency, timestamp }
```

### Tester
- [ ] Unit: policyutvärdering (matris av mötestyper/kostnadstak)
- [ ] Shadow-mode i staging: logga vilket val routern **skulle** gjort
- [ ] E2E: sätt lågt tak → verifiera downgrade och UI-indikator

### Database Schema
```sql
CREATE TABLE "TenantBudget" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "monthlyLimit" DECIMAL(10,2) NOT NULL,
  "usedThisMonth" DECIMAL(10,2) DEFAULT 0,
  "perMeetingLimit" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎯 PR #5 – Degrade Mode

### Acceptance Criteria
- [ ] Vid join-fel triggas **post-mötesspår** automatiskt
- [ ] Användaren får **vänlig banner**: "Vi missade live, men levererar efter mötet"
- [ ] Audit: `join_fail`, `degrade_to_post`, ingen data tappas

### Mätpunkter
```typescript
join_attempt: { meetingId, provider, timestamp }
join_fail_reason: { meetingId, error, provider, timestamp }
degrade_mode_on: { meetingId, reason, timestamp }
time_to_after_recap: { meetingId, duration, timestamp }
```

### Tester
- [ ] Simulera fel i join-service → förvänta degradeläge + post-brief skapad
- [ ] DLQ/idempotens: om artifact kommer sent → exakt 1 recap
- [ ] Recovery: testa återhämtning från degrade mode

### Database Schema
```sql
CREATE TABLE "DegradeEvent" (
  "id" TEXT PRIMARY KEY,
  "meetingId" TEXT NOT NULL,
  "failureType" TEXT NOT NULL,
  "degradeMode" TEXT NOT NULL,
  "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "success" BOOLEAN NOT NULL
);
```

---

## 📅 Utrullning (rekommenderad ordning)

### Vecka 1: Skyddsnät
1. **Degrade Mode** (skyddsnät för alla andra features)
2. **Model Router** (kostnad & latens-kontroll)

### Vecka 2: Direkt värde
3. **Decision-Close Card** (direkt värde för användare)
4. **Regwatch Push** (USP-differentiering)

### Vecka 3: Wow-faktor
5. **Doc-Copilot v1** (wow-faktor och premium-känsla)

---

## 🗓️ Dagsplan (kan köras nu)

### Måndag: Degrade Mode
- [ ] Slå på **Degrade Mode** i staging
- [ ] Prova 3 felvägar (network, auth, timeout)
- [ ] Mät TTA (time-to-after-recap)
- [ ] Verifiera att ingen data tappas

### Tisdag: Model Router
- [ ] Aktivera **Router** i shadow-mode
- [ ] Jämför kostnad/latens med nuvarande modell
- [ ] Testa budget-tak och downgrade-logik
- [ ] Verifiera UI-indikatorer

### Onsdag: Decision-Close Card
- [ ] Canary-rulla **Decision-Close** till 10% tenants
- [ ] Testa Adaptive Cards i Teams/Zoom
- [ ] Verifiera Planner/Jira integration
- [ ] Kontrollera idempotens

### Torsdag: Regwatch Push
- [ ] Aktivera **Regwatch Push** i staging
- [ ] Granska 5 notiser manuellt för kvalitet
- [ ] Testa relevansfilter och tystning
- [ ] Verifiera post-brief integration

### Fredag: Doc-Copilot v1
- [ ] Öppna **Doc-Copilot v1** för intern pilot
- [ ] Samla feedback från testanvändare
- [ ] Testa diff-motor och källcitering
- [ ] Verifiera PII-maskning

---

## 🔧 Environment Variables

```bash
# Feature flags
DECISION_CLOSE_ENABLED=false
DOC_COPILOT_ENABLED=false
REGWATCH_PUSH_ENABLED=false
MODEL_ROUTER_ENABLED=false
DEGRADE_MODE_ENABLED=true

# Model router
ROUTER_DEFAULT_TIER=fast
ROUTER_BUDGET_WARNING_THRESHOLD=0.8
ROUTER_AUTO_DOWNGRADE=true

# Degrade mode
DEGRADE_ENABLED=true
DEGRADE_RETRY_ATTEMPTS=3
DEGRADE_RETRY_DELAY=5000
```

---

## 📊 Success Metrics Dashboard

### KPI:er att mäta
- **Decision coverage**: % beslut med ägare+deadline
- **Doc-copilot adoption**: % möten som använder doc-copilot
- **Regwatch relevance**: % relevanta notiser vs totala
- **Model router efficiency**: kostnad per möte, latens p95
- **Degrade mode success**: % möten som återhämtar sig från degrade

### Alerting
- Decision coverage < 90%
- Doc-copilot error rate > 5%
- Regwatch false positive rate > 20%
- Model router budget exceeded
- Degrade mode failure rate > 10%

---

**Denna plan är redo att köras rakt av i nästa sprint!** 🚀
