# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds App Router entries, server functions, and the landing experience; keep feature logic co-located with its route segment.
- `app/components/` contains marketing-specific sections, while `components/ui/` mirrors the shadcn/ui primitives—extend these instead of duplicating styling.
- Shared hooks live under `hooks/`, cross-cutting helpers (e.g., `cn`) stay in `lib/utils.ts`, and global styling resides in `styles/globals.css`.
- Static assets belong in `public/`; reference them with root-relative paths (e.g., `/placeholder.svg`). Avoid committing `.next/` or `.venv/` artifacts.

## Build, Test, and Development Commands
- `pnpm install` resolves dependencies (pnpm is implied by the committed `pnpm-lock.yaml`).
- `pnpm dev` starts the Next.js dev server with hot reload. Use this for local QA.
- `pnpm build` generates an optimized production bundle; confirm it succeeds before releases.
- `pnpm start` serves the build output locally, mirroring the production runtime.
- `pnpm lint` runs `next lint`; treat warnings as blockers and fix autofixable issues with `pnpm lint --fix` when necessary.

## Coding Style & Naming Conventions
- TypeScript is mandatory; keep component files as `.tsx` and server utilities as `.ts`.
- Follow the existing 2-space indentation and prefer `PascalCase` for React components, `camelCase` for functions/variables, and `SCREAMING_SNAKE_CASE` only for constants that map to env values.
- Compose UI with Tailwind classes; centralize reusable variants with `class-variance-authority` in `components/ui/` or helper utilities.
- Use the `@/` alias for imports instead of relative traversal, and keep props typed explicitly for public components.

## Agentplattform & Integrationer
- Mötesagenten orkestreras via `lib/agents/` och nyttjar plattformsadaptrar i `lib/integrations/providers/` för Teams, Zoom, Google Meet och Webex.
- Schemalägg, avboka och hämta sammanfattningar genom API-endpoints under `app/api/agents/*`; se `schedule`, `cancel`, `summarize` och `webhooks/[provider]`.
- Lägg in respektive plattformsuppgifter i `.env.local` (se `.env.example`) och bind upp webhook-URL:er mot `https://<domän>/api/agents/webhooks/<provider>` i leverantörernas adminportaler.
- AI-sammanfattningar proxyas mot `AI_ASSISTANT_API_URL`; tänk på att förnya nycklar och uppdatera `AI_ASSISTANT_WEBHOOK_SECRET` om AI-tjänsten postar callbacks.
- Eventflöden, beslutskort och action-router konfigureras via `lib/agents/events|decision-cards|action-router`; policy och samtycken hanteras centralt i `lib/agents/policy`. Alla nya moduler ska registreras i `ensureAgentBootstrap()`.
- Briefing Engine finns i `lib/agents/briefing` och skapar automatiskt pre/post-briefer; se till att mötesmetadata sätts vid schemaläggning så køn kan köras.
- Upphandlingssimulatorn (`app/api/agents/procurement/simulate`) använder `lib/modules/procurement/simulator` och kräver två kravvarianter (A/B); AI-endpointen faller tillbaka till heuristik om API saknas.
- Stakeholder-kartan genereras automatiskt via `lib/modules/stakeholders/analyzer` när mötet summeras och kan hämtas genom `/api/agents/meetings/{id}`.
- Doc-copilot hittas under `app/api/agents/documents/analyze`; skicka nuvarande + föreslagen text så returneras diff-segment och källrekommendationer.
- Regelförändringsvakten (`app/api/agents/regwatch`) listar aktuella ändringar i AI Act, GDPR och LOU med rekommendationer.

## Status-översikt (December 2024)

### ✅ **Komplett Backend**
- **PostgreSQL**: 10 tabeller med Prisma ORM
- **Redis**: Cache, rate limiting, job queues
- **API**: 15+ endpoints för alla agent-funktioner
- **Integrations**: Teams, Zoom, Google Meet, Webex
- **AI-moduler**: Orchestrator, Decision Cards, Briefing, Stakeholder Analyzer, Doc-copilot, Procurement Simulator, Regwatch, Nudging

### ⚠️ **Lösa trådar (Blockerar produktion)**
- **Next.js 15-fel**: Event handlers, searchParams
- **Observability**: OpenTelemetry/Winston build-fel
- **Autentisering**: OAuth2/JWT saknas
- **Testning**: Komplett testsuite saknas

### 🎯 **Nästa steg**
1. Fixa Next.js 15-kompatibilitet
2. Implementera OAuth2/JWT
3. Skapa testsuite
4. Säkerhetsgenomgång

## Nya Funktioner & Förbättringar ✅

### Databas & Persistens
- **PostgreSQL Integration**: Fullständig Prisma schema med 10 tabeller (Meeting, DecisionCard, ActionItem, MeetingBrief, Stakeholder, etc.)
- **DatabaseStore**: Ersätter MemoryStore med persistent lagring i PostgreSQL
- **Meeting Repository**: CRUD-operationer för möten via `lib/db/repositories/meetings.ts`
- **API Integration**: POST/GET `/api/agents/meetings` fungerar med databas

### Redis & Performance
- **Rate Limiting**: Redis-baserad rate limiting (100 req/15min GET, 10 req POST)
- **Caching Service**: Generisk cache med TTL och pattern-invalidering
- **Job Queues**: BullMQ-integration för meeting-processing, briefing och notifications
- **Redis Client**: Robust Redis-klient med fallback när Redis inte är tillgänglig

### Säkerhet & Robusthet
- **APIError Class**: Strukturerad felhantering med HTTP-statuskoder
- **Rate Limit Enforcement**: IP-baserad rate limiting med Redis-counters
- **Graceful Degradation**: Systemet fungerar även när Redis/PostgreSQL inte är tillgänglig
- **Error Handling**: Robust felhantering i alla API-endpoints

## Produktionsplan & Kritiska Gap

### Tekniska brister att åtgärda
- **Frontend**: ✅ **DELVIS KLART!** Dashboard med Decision Cards, Briefs, Regwatch, Retention, Nudging - men har Next.js 15-fel.
- **Persistens**: ✅ **KLART!** PostgreSQL med Prisma schema (10 tabeller), Redis cache, DatabaseStore ersätter MemoryStore.
- **Säkerhet**: ✅ **DELVIS KLART!** Rate limiting med Redis (100 req/15min GET, 10 req POST), APIError handling, placeholder auth.
- **Observability**: ✅ **DELVIS KLART!** Grundläggande metrics, men OpenTelemetry/Winston har build-fel.
- **Testning**: inga unit/integration/E2E-tester; saknar mockar för externa API:er.

### Lösa trådar (Kritiska för produktion)
- **Next.js 15-fel**: Event handlers kan inte passas till Client Components, searchParams måste awaitas
- **Observability build-fel**: OpenTelemetry Resource constructor-fel, Winston os-modul-fel
- **Next.js cache-problem**: ENOENT-fel, saknade moduler i .next/server/
- **Autentisering**: OAuth2/JWT saknas, bara placeholder auth
- **Komplett testsuite**: Unit/integration/E2E-tester saknas

### Prioriterad roadmap (10 veckor)
1. **Vecka 1–2 – Säkerhetsgrund**: OAuth2/JWT, Zod-validering på alla endpoints, CORS/rate limiting. ✅ **DELVIS KLART!**
2. **Vecka 3–4 – Databaser**: Inför Postgres (möten, stakeholders, audit), Redis cache och backup-plan. ✅ **KLART!**
3. **Vecka 5–6 – Frontend**: Dashboard med Decision Cards, Briefs, Regwatch och Consent-hantering + UI för "magisk inbjudan" & 1‑klick-toggles. ✅ **DELVIS KLART!**
   - **Ticket A: Retention & Radera allt** – BullMQ-svep för retention per samtyckesprofil, UI-knapp som triggar rensning + audit-logg + export av consent receipt. ✅ **KLART!**
   - **Ticket B: Regwatch v1** – nattligt jobb som hämtar 3–5 källor, normaliserar, versionerar och skapar alerts i regwatch-vyn + ping i post-brief om relevant. ✅ **KLART!**
4. **Vecka 7–8 – Observability**: OpenTelemetry, Prometheus/Grafana, Sentry, kostnadsmetrik per möte. ✅ **DELVIS KLART!**
5. **Vecka 9–10 – Robusthet/Test**: Jobbkedja för nudging (BullMQ/Cloud Tasks), komplett testsuite, CI/CD samt Teams/Zoom slash-kommandon, "Alltid-på" etiketter och signerad magisk länk som fallback. ✅ **DELVIS KLART!**

### Nästa prioritet (Lösa trådar)
6. **Vecka 11–12 – Fixa kritiska fel**: Next.js 15 event handlers, searchParams, OpenTelemetry build-fel, cache-problem
7. **Vecka 13–14 – Produktionsredo**: OAuth2/JWT autentisering, komplett testsuite, säkerhetsgenomgång
8. **Vecka 15–16 – Polish & Launch**: Frontend-polish, performance-optimering, dokumentation, CI/CD

### Möteskoppling & onboarding
- **Primär**: "Magisk inbjudan" (unik agentadress) och "1‑klick i kalendern"-toggle i portalen.
- **Sekundär**: Teams/Zoom slash-kommandon för power users.
- **Fallback**: "Alltid-på" etiketter/kalendar + signerad "magisk länk" för låsta miljöer.
- Samtyckeskort visas vid join och kvittot inkluderas i post-brief; UI visar live-status (lobby → aktiv → efterarbete) och en knapp för omedelbar offboarding.

Detaljerade tickets finns i `docs/roadmap/v1-checklist.md`; uppdatera checklistan löpande när arbete planeras eller levereras. Den fulla produktionsplanen ligger i `docs/roadmap/production-plan.md`.
- Arkitektur- och roadmap-detaljer finns under `docs/architecture/` och `docs/roadmap/30-60-90.md`; modulshopens SLA dokumenteras i `docs/modules/catalog.md`.

## Testing Guidelines
- Automated tests are not configured yet; when introducing them, colocate `*.test.ts(x)` beside the unit under test and add a `pnpm test` script.
- Until a harness exists, rely on `pnpm lint` and interaction testing in `pnpm dev`; document manual QA steps in your PR.
- Maintain mock API responses in `app/api/` to avoid flakey network calls during manual verification.

## Commit & Pull Request Guidelines
- Write concise, descriptive commit subjects (67 characters or fewer) using sentence case with optional context after a colon, e.g., `Refine hero call-to-action`.
- Squash fixup commits locally; each PR should read as a coherent story from the history.
- PRs must include: purpose summary, screenshots or clips for UI-facing changes, linked issue or ticket, manual testing notes, and a risk callout.
- Request review from the domain owner for any modifications under `components/ui/` or shared hooks to preserve design consistency.
