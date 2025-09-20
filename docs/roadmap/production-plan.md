# Produktionsplan – Postboxen AI-kollega

## Översikt (obligatoriska komponenter)
1. **Frontend & UX**
   - Dashboard (beslut, briefer, stakeholders, regwatch)
   - Konfigurationssidor (samtycke, moduler, integrationer)
   - UI för procurement-simulator och doc-copilot
   - Responsiv design och tillgänglighet

2. **Autentisering & säkerhet**
   - OAuth2/JWT med rollbaserad access
   - Inputvalidering på samtliga endpoints
   - Rate limiting och CORS-policy
   - Secrets-hantering och säker loggning

3. **Persistens & data**
   - Postgres för möten, beslut, briefer, stakeholders, regwatch
   - Redis cache/job queue
   - Schema/migrationer, backup-plan, retention policies

4. **Jobbkedjor & automation**
   - 48h-nudging via BullMQ/Cloud Tasks
   - Schemaläggare för regwatch + pre-brief
   - Dead letter queues och retry-strategier

5. **Observability & drift**
   - OpenTelemetry-tracing
   - Prometheus/Grafana-metrics
   - Strukturerad logging + dashboard
   - Alerting på kritiska SLO:er

6. **Test & kvalitet**
   - Unit-, integration- och E2E-tester
   - Mockade externa tjänster & contract tests
   - CI-pipeline (lint/test/build)
   - Lasttester & kostnadsuppföljning

## Möteskoppling – standardflöden
- **Primär**: "Magisk inbjudan" (unik agentadress) + "1‑klick i kalendern" (toggle i portalen) för 90 % av kundernas möten.
- **Sekundär**: Teams/Zoom slash-kommandon (`/kollegan join`) för power users.
- **Fallback**: "Alltid-på" etiketter/kalendar och signerad "magisk länk" för låsta miljöer.
- Samtyckeskort skickas vid join (Bas/Plus/Juridik) och lagras i post-brief; live-status i UI visar lobby/aktiv/efterarbete.
- Offboarding: knapp "Ta bort agenten och radera allt" + 3 automatiska join-retrys innan nedgradering till efterhandsanalys.

---

## Fasindelad arbetsplan

### Fas 1 – Säkerhetsgrund (vecka 1–2)
1. Inför OAuth2/JWT + rollsystem.
2. Lägg till Zod-validering på samtliga endpoints.
3. Rate limiting (Redis) och strikt CORS-policy.
4. Inför schema för secrets/konfig (t.ex. Zod + dotenv-safe).
5. Ta fram security checklist och planera penetrationstest/bug bounty-light.

### Fas 2 – Persistenslager (vecka 3–4)
1. Inför Postgres via ORM (Prisma/Drizzle).
2. Migrera data från MemoryStore till DB (möten, actions, briefs, stakeholders, regwatch).
3. Lägg till Redis cache/job queue och backupstrategi.
4. Implementera retention och automatiska backup-jobb.

**Detaljerade delmål:**
1.1 Sätt `DATABASE_URL` (include `sslmode=require` om managed).
1.2 Kör `pnpm db:push` och verifiera schema.
1.3 Röktesta read/write via `/api/agents/meetings` (POST/GET).
2.1 Refaktor agents till repositories (mötet, decisions, actions, briefs, stakeholders, consent, audit).
2.2 Skapa migrationsscript för befintlig data (om tidigare miljö).
3.1 Provisionera Redis och sätt `REDIS_URL`.
3.2 Koppla rate limit till Redis.
3.3 Skapa BullMQ queue `agent-jobs` (nudges, regwatch, join-retries).
4.1 Aktivera dagliga Postgres snapshots (30/90 dagears retention).
4.2 Säkerställ Redis-backup (managed snapshot eller dump).
4.3 Dokumentera återställningsprocess.

### Fas 3 – Frontend & UX (vecka 5–6)
1. Bygg dashboard med mötesöversikt, beslut och actions.
2. Visualisera pre/post-briefs och stakeholder-profiler.
3. Skapa UI för regwatch, procurement-simulator och doc-copilot.
4. Lägg till settings för consent, tokens, moduler.
5. Leverera "Magisk inbjudan" (adress + instruktion) och "1‑klick i kalendern"-toggle inkl. live-status.

### Fas 4 – Observability & drift (vecka 7–8)
1. Inför OpenTelemetry (trace) och Prometheus (metrics).
2. Strukturerad JSON-loggning + korrelations-ID.
3. Felspårning (t.ex. Sentry) och performance monitoring.
4. Alerting på definierade SLO:er (latency, fel, kostnad).

### Fas 5 – Automatisering & modulshop (vecka 9–10)
1. Jobbkedjor (BullMQ/Cloud Tasks) för 48h-nudging och regwatch.
2. Modulshop UI + billinghook + feature-flags.
3. Persistens och versionshistorik för regwatch.
4. CI/CD-pipeline (lint/test/build/deploy).
5. Teams/Zoom-app med `/join`, "Alltid-på" etiketter och signerad “magisk länk” för specialfall.

### Fas 6 – Test & härdning (kontinuerligt)
- Agera parallellt per modul/fas:
  - Unit/integration/E2E-tester.
  - Mock för externa tjänster, contract testing.
  - Lasttester innan go-live.
  - Incident-runbooks och “break-glass”-processer.

**E2E-scenarion:**
1. Schemalägg möte → agent join → recap + action i Planner/Trello → nudging 48h.
2. Join misslyckas → 3 retries → degradering till efterhandsanalys.

**Riskhantering:**
- Postgres/Redis saknas → åtgärdas i Fas 2 (env, push, backup).
- Frontend saknas → byggs i Fas 3.
- Observability/test → Fas 4 & 6.
- Agent jobb/kedjor → Fas 5.
**Delaktiviteter:**
1. Dashboard-tabell (kommande 7 dagar) + status (lobby/inne/klart).
2. Read-only vy för pre/post-briefs, stakeholders, regwatch.
3. Procurement/doc-copilot modals (visa resultat).
4. Consent- & modulinställningar + retention-vy.
5. Visa agent-e-post (“magisk inbjudan”), 1‑klick toggle och live-status (grön/gul/röd).
**Delaktiviteter:**
1. Sentry integrerad i API & workers.
2. OpenTelemetry spans för `/api/agents/*` + BullMQ-jobb.
3. Prometheus `/metrics` (request_count, duration, job_run_duration, tokens, kostnad/meeting).
4. Dashboard/alerting på P95 latency, fel, kostnader.
**Delaktiviteter:**
1. Nudging-jobb (BullMQ) med retries & DLQ.
2. Modulshop UI med toggles (Juridik-Gunnar m.fl.).
3. Spara regwatch-historik + UI.
4. CI/CD pipeline.
5. Teams/Zoom slash-kommandon, "Alltid-på" etiketter, signerad magisk länk.
