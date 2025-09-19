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

## Produktionsplan & Kritiska Gap

### Tekniska brister att åtgärda
- **Frontend saknas**: inget dashboard/UI för beslut, briefer, stakeholders eller simulator.
- **Persistens**: all data ligger i `MemoryStore`; kräver Postgres/Redis + backupstrategi.
- **Säkerhet**: ingen auth, rate limiting, input-säkring eller secrets management.
- **Observability**: saknar strukturerad loggning, metrics, tracing och alerting.
- **Testning**: inga unit/integration/E2E-tester; saknar mockar för externa API:er.

### Prioriterad roadmap (10 veckor)
1. **Vecka 1–2 – Säkerhetsgrund**: OAuth2/JWT, Zod-validering på alla endpoints, CORS/rate limiting. ✅
2. **Vecka 3–4 – Databaser**: Inför Postgres (möten, stakeholders, audit), Redis cache och backup-plan. _(pågår – Prisma schema klus klart, nästa steg migrera logik)_.
3. **Vecka 5–6 – Frontend**: Dashboard med Decision Cards, Briefs, Regwatch och Consent-hantering + UI för "magisk inbjudan" & 1‑klick-toggles.
4. **Vecka 7–8 – Observability**: OpenTelemetry, Prometheus/Grafana, Sentry, kostnadsmetrik per möte.
5. **Vecka 9–10 – Robusthet/Test**: Jobbkedja för nudging (BullMQ/Cloud Tasks), komplett testsuite, CI/CD samt Teams/Zoom slash-kommandon, "Alltid-på" etiketter och signerad magisk länk som fallback.

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
