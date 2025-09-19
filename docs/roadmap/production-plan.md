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

---

## Fasindelad arbetsplan

### Fas 1 – Säkerhetsgrund (vecka 1–2)
1. Inför OAuth2/JWT + rollsystem.
2. Lägg till Zod-validering på samtliga endpoints.
3. Rate limiting (Redis) och strikt CORS-policy.
4. Inför schema för secrets/konfig (t.ex. Zod + dotenv-safe).

### Fas 2 – Persistenslager (vecka 3–4)
1. Inför Postgres via ORM (Prisma/Drizzle).
2. Migrera data från MemoryStore till DB (möten, actions, briefs, stakeholders, regwatch).
3. Lägg till Redis cache/job queue och backupstrategi.
4. Implementera retention och automatiska backup-jobb.

### Fas 3 – Frontend & UX (vecka 5–6)
1. Bygg dashboard med mötesöversikt, beslut och actions.
2. Visualisera pre/post-briefs och stakeholder-profiler.
3. Skapa UI för regwatch, procurement-simulator och doc-copilot.
4. Lägg till settings för consent, tokens, moduler.

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

### Fas 6 – Test & härdning (kontinuerligt)
- Agera parallellt per modul/fas:
  - Unit/integration/E2E-tester.
  - Mock för externa tjänster, contract testing.
  - Lasttester innan go-live.
  - Incident-runbooks och “break-glass”-processer.
