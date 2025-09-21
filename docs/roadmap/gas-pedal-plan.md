# 🚀 Dag 0–1: Prod preflight (10 punkter)

## ✅ Checklista för produktion

1. **Slå på Degrade Mode** i prod (ni har flaggan =1 ✅)
   ```bash
   FEATURE_DEGRADE_MODE=1
   ```

2. **Router i shadow-mode** första dygnet (logga val, påverka ej svar)
   ```bash
   ROUTER_MODE=shadow
   ```

3. **Kör migrations + starta workers** separat (BullMQ/DLQ)
   ```bash
   pnpm exec prisma migrate deploy
   # Starta workers i separata pods/processer
   ```

4. **Sätt budgettak**: `ROUTER_BUDGET_PER_MEETING=35` (sänk till 30 om kostnad > mål)
   ```bash
   ROUTER_BUDGET_PER_MEETING=35
   ```

5. **Aktivera Sentry + OTel** (dsn/endpoint ifyllda)
   ```bash
   SENTRY_DSN=your-sentry-dsn
   OTEL_EXPORTER_OTLP_ENDPOINT=your-otel-endpoint
   ```

6. **Cron för retention**: `RETENTION_CRON="0 3 * * *"`
   ```bash
   RETENTION_CRON="0 3 * * *"
   ```

7. **Staging: Decision-Close Card** för 1 pilotkund (track "decision_coverage")
   ```bash
   FEATURE_DECISION_CLOSE_CARD=1  # staging only
   ```

8. **Staging: Regwatch Push**, manuellt sanity-checka 3 notiser
   ```bash
   FEATURE_REGWATCH_PUSH=1  # staging only
   ```

9. **Intern: Doc-Copilot v1** dark-launch; samla 10 diff-feedbacks
   ```bash
   FEATURE_DOC_COPILOT_V1=1  # internal only
   ```

10. **Lägg kill-switch-kommandon** nära till hands (router off, degrade on)
    ```bash
    # Kill-switch commands ready
    FEATURE_MODEL_ROUTER=0  # emergency off
    FEATURE_DEGRADE_MODE=1  # safety net on
    ```

---

# 24h Watchlist (larmnivåer)

## 🚨 Kritiska KPI:er att övervaka

* **Join success** p95 ≥ 99% → < 98% ⇒ auto-degrade (banner + efterhandsanalys)
* **Recap p95** < 90s → > 120s ⇒ sänk modellnivå (router "fast")
* **Felrate** < 0.5% (5-min glidande) → > 1% ⇒ stoppa "deep" i router
* **Kostnad/möte** ≤ 30–35 kr → > 35 ⇒ sänk budgettak till 30, bekräfta i UI
* **Decision coverage** = 100% vid mötesslut (ägare+deadline på alla öppna beslut)

## 📊 Dashboard Panels att övervaka

1. **Join Success Rate** - måste vara ≥ 99%
2. **Recap Latency p95** - måste vara < 90s
3. **Error Rate** - måste vara < 0.5%
4. **Cost per Meeting** - måste vara ≤ 35 SEK
5. **Decision Coverage** - måste vara 100%

---

# Kanarierullning (rekommenderad ordning)

## 1. Degrade Mode (på globalt) – redan klart ✅
```bash
FEATURE_DEGRADE_MODE=1  # Globalt aktiverat
```

## 2. Model Router → shadow 24h → 10% → 50% → 100%
```bash
# Dag 1: Shadow mode
ROUTER_MODE=shadow

# Dag 2: 10% canary
ROUTER_MODE=live
ROUTER_CANARY_PERCENTAGE=10

# Dag 3: 50% rollout
ROUTER_CANARY_PERCENTAGE=50

# Dag 4: 100% rollout
ROUTER_CANARY_PERCENTAGE=100
```

## 3. Decision-Close Card → 10% → 50% → 100% (följ "coverage")
```bash
# Dag 2: 10% canary
FEATURE_DECISION_CLOSE_CARD=1
DECISION_CLOSE_CANARY_PERCENTAGE=10

# Dag 3: 50% rollout
DECISION_CLOSE_CANARY_PERCENTAGE=50

# Dag 4: 100% rollout
DECISION_CLOSE_CANARY_PERCENTAGE=100
```

## 4. Regwatch Push → staging→prod (approved sources), höj relevanströskel vid brus
```bash
# Dag 3: Staging → Prod
FEATURE_REGWATCH_PUSH=1
REGWATCH_RELEVANCE_THRESHOLD=0.7  # höj vid brus
```

## 5. Doc-Copilot v1 → intern pilot → 1 kund → bredare
```bash
# Dag 4: Intern pilot
FEATURE_DOC_COPILOT_V1=1
DOC_COPILOT_PILOT_MODE=true

# Dag 5: 1 kund
DOC_COPILOT_PILOT_MODE=false
DOC_COPILOT_CANARY_PERCENTAGE=5

# Dag 6: Bredare rollout
DOC_COPILOT_CANARY_PERCENTAGE=25
```

---

# Snabb UAT (5 min, staging)

## ✅ Testa alla features i staging

1. **Bjud in Kollegan** → se **pre-brief**
2. **Säg "Beslutar X, Anna ansvar, 15 okt"** → **Decision-Close Card** kräver ägare+deadline → task skapas i Planner/Jira
3. **Compliance** → exportera consent → **Radera allt** → artefakter borta, audit kvar
4. **Observability** → kostnad/möte + p95 syns och uppdateras

## 🎯 Förväntade resultat

- ✅ Pre-brief genereras korrekt
- ✅ Decision-Close Card visas vid mötesslut
- ✅ Task skapas i Planner/Jira med korrekt ägare+deadline
- ✅ Consent export fungerar
- ✅ "Radera allt" tar bort artefakter men behåller audit
- ✅ Observability visar korrekt kostnad och latens

---

# "Klart att skeppa?" check

## ✅ Pre-flight checklista

* ✅ **Tests**: `pnpm test:ci` + `pnpm test:e2e` grönt
* ✅ **Migrations**: `pnpm exec prisma migrate deploy` körda
* ✅ **Feature-flaggor**: enligt plan (prod OFF, staging ON)
* ✅ **Larm och dashboards**: aktiva och konfigurerade
* ✅ **Rollback-väg**: feature-off + ev. down-migration/soft-disable

## 🚨 Emergency procedures

### Immediate Rollback (0-5 min)
```bash
# Disable all new features
FEATURE_DECISION_CLOSE_CARD=0
FEATURE_DOC_COPILOT_V1=0
FEATURE_REGWATCH_PUSH=0
FEATURE_MODEL_ROUTER=0
FEATURE_DEGRADE_MODE=1  # keep safety net
```

### Database Rollback (5-15 min)
```bash
# Run down migrations if needed
pnpm exec prisma migrate rollback
```

### Full Rollback (15-30 min)
```bash
# Deploy previous version
git checkout previous-stable-tag
pnpm build && pnpm start
```

---

# Router Shadow-Mode Implementation

## 🎯 Shadow-Mode Flagga

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

---

**Denna plan tar er från MVP till awesome utan drama!** 🚀
