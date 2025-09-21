# 🚀 Go/No-Go på 15 min (agenda)

## 1. Status (2 min): senaste build + migrations ✔️
- [ ] Build passerar: `pnpm build`
- [ ] Migrations körda: `pnpm exec prisma migrate deploy`
- [ ] Tests gröna: `pnpm test:ci`
- [ ] E2E gröna: `pnpm test:e2e`

## 2. Feature flags (3 min): vilka PR:er ON i **staging**, vilka OFF i **prod**
- [ ] **Staging**: Alla features ON för testing
- [ ] **Prod**: Endast Degrade Mode ON (skyddsnät)
- [ ] **Canary**: 10% tenants för Model Router (shadow mode)

## 3. SLO/Alerts (4 min): p95 recap < 90s, join-success > 99%, felbudget, kostnad/möte
- [ ] **Recap p95**: < 90s (alert vid > 120s)
- [ ] **Join success**: > 99% (alert vid < 98%)
- [ ] **Error rate**: < 0.5% 5-min moving (alert vid > 1%)
- [ ] **Kostnad/möte**: ≤ 30-35 SEK (alert vid > 40 SEK)

## 4. Risk & rollback (3 min): kill-switchar, backout (db + feature flags)
- [ ] **Kill-switchar**: Feature flags dokumenterade
- [ ] **Backout**: Database migrations reversibla
- [ ] **Rollback**: Tidigare version deploybar inom 5 min

## 5. "Ship it?" (3 min): Ja/Nej + who's on-call
- [ ] **On-call**: [Name] - [Phone] - [Email]
- [ ] **Escalation**: [Team Lead] - [Phone]
- [ ] **Decision**: Ja/Nej + motivering

---

# Miljöflaggor (lägg in nu)

```bash
# Alltid av i prod först – slå på i staging
FEATURE_DECISION_CLOSE_CARD=0
FEATURE_DOC_COPILOT_V1=0
FEATURE_REGWATCH_PUSH=0
FEATURE_MODEL_ROUTER=0
FEATURE_DEGRADE_MODE=1   # ha skyddsnätet PÅ

# Router/kostnad
ROUTER_DEFAULT_TIER=fast   # fast|balanced|deep
ROUTER_BUDGET_PER_MEETING=35   # SEK

# Compliance/retention
RETENTION_CRON="0 3 * * *"     # kör nattligt svep
DATA_RESIDENCY=eu
DELETE_ALL_REQUIRE_CONFIRM=true

# Observability
SENTRY_DSN=your-sentry-dsn-here
OTEL_EXPORTER_OTLP_ENDPOINT=your-otel-endpoint-here
PROM_PUSHGATEWAY_URL=your-prometheus-pushgateway-here

# Test-only (måste vara AV i prod)
E2E_BYPASS_AUTH=0
```

---

# Dag 0 cutover (kompakt)

1. **Migrera**: `pnpm exec prisma migrate deploy`
2. **Starta workers** (BullMQ, separata pods/processer)
3. **Slå på Degrade Mode** i prod (flagga = 1)
4. **Canary** 10% tenants: `FEATURE_MODEL_ROUTER=1` → skuggläge/telemetri, **ingen** synlig ändring
5. **Rulla Decision-Close Card** i staging → 1 pilotkund → följ KPI: *decision coverage* ≥ 90%
6. **Regwatch Push** i staging (kvalitetsgranskade källor)
7. **Doc-Copilot v1** internt (dark launch) → samla 10 diff-feedbacks

---

# Post-release övervakning (vad vi tittar på första timmen)

* **Join success** (≥ 99%); om < 98% → auto-degrade (flagga finns).
* **Recap p95** (< 90s); om > 120s → sänk modellnivå via router.
* **Felrate** (< 0.5% 5-min moving); topp? → pause router "deep".
* **Kostnad/möte** (mål ≤ 25–30 kr); > 35 kr → aktivera budgettak (router).

---

# "Awesome"-KPI:er (syns i dashboarden nu)

* **Sparad tid/möte:** mål ≥ 25 min
* **48h completion:** mål ≥ 70%
* **Decision coverage:** 100% av beslut har ägare + deadline vid mötesslut
* **Kostnad/möte:** ≤ 30–35 kr
* **Raderingar/retention events:** loggas med audit-kvitton

---

# Snabb UAT-script (5 min i staging)

1. Bjud in Kollegan → se **pre-brief**
2. Säg "Vi beslutar X, Anna tar den, deadline 15 okt" → se **Decision Card**
3. Stäng mötet → **Decision-Close Card** kräver ägare + deadline → skapa Planner-task
4. Öppna **Compliance** → exportera consent receipt → klicka **Radera allt** → data borta, audit kvar
5. Växla till **Observability** → bekräfta kostnad/möte och p95

---

# Risker & kill-switchar

* **Router spikar kostnad/latens** → `FEATURE_MODEL_ROUTER=0`
* **Join-fel** → `FEATURE_DEGRADE_MODE=1` (redan PÅ)
* **Adaptive Card backar ut** → fallback i post-brief + e-post
* **Regwatch brus** → sänk relevanströskel i env; visa endast "approved sources"

---

# Förslag: 2 piloter + 1 enterprise-vänlig

* **Pilot A (SMB, ofta upphandlingar)**: mät 48h completion + decision coverage
* **Pilot B (IT-konsult)**: mät sparad tid/möte + kostnad/möte
* **Enterprise-vänlig**: kör SSO/SAML i staging, DPA/DPIA signoff, lägsta OAuth-scopes
