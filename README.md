# Postboxen – AI-kollega för Teams och Zoom

Postboxen är en AI-driven möteskollega som ansluter till Teams, Zoom, Google Meet och Webex. Den dokumenterar automatiskt, skapar beslutskort, routar åtgärder och levererar färdiga sammanfattningar samt intressentinsikter, komplett med juridiska referenser. Projektet drivs i Next.js 15 (App Router) med TypeScript och pnpm.

## Funktionalitet
- **Pre/Post-Brief** – pre-brief 30 min före mötet och executive-post-brief efter avslut via `lib/agents/briefing`.
- **Decision Cards & Action Router** – beslut och “jag tar den” fångas automatiskt och skickas till Planner/Jira/Trello.
- **Stakeholder-karta** – analys av intressenter och skräddarsydda pitchförslag vid sammanfattning.
- **Doc-copilot** – diffar avtal/upphandlingstexter med motiveringar (`/api/agents/documents/analyze`).
- **Regelförändringsvakt** – bevakar AI Act/GDPR/LOU via `/api/agents/regwatch`.
- **Procurement-simulator** – A/B jämförelse av kravtexter (`/api/agents/procurement/simulate`).

## Snabbstart
```bash
pnpm install
pnpm dev
```
Applikationen startar på `http://localhost:3000`. En `.env.local` behövs (se `.env.example`).

> **Obs:** Ange `DATABASE_URL` (Postgres) innan du kör `pnpm db:push` för att provisionera databasen.

## API-endpoints
- `POST /api/agents/schedule` – schemalägg agenten för ett möte.
- `POST /api/agents/summarize` – genererar sammanfattning och kickar igång post-brief + stakeholder-analys.
- `GET /api/agents/meetings` / `GET /api/agents/meetings/:id` – listar möten och detaljer (briefer, stakeholders, audit).
- `POST /api/agents/procurement/simulate` – kravsimulator A/B.
- `POST /api/agents/documents/analyze` – Doc-copilot diff.
- `GET /api/agents/regwatch` – aktuella regelförändringar.

## Arkitektur
- **Agents & Events**: `lib/agents/*`, `lib/modules/*` bygger på EventBus med policy/memory-lager.
- **Dokumentation**: `docs/architecture/agent-platform.md`, `docs/modules/*.md`, `docs/roadmap/*`.
- **UI**: marknadslandning i `app/page.tsx` med svensk SME-fokus.

## Utveckling
- Paketmanager: `pnpm`
- Kodstil: `pnpm lint`
- Viktiga moduler: Briefing Engine, Decision Cards, Stakeholder Analyzer, Doc Copilot, Regulation Watcher.

## Nästa steg
- Jobbkedja för 48h-nudging (BullMQ/Cloud Tasks)
- Modulshop v1 (Juridik-Gunnar, Upphandling-Saga, HR-Eva, Ekonomi-Stefan)
- Persistenslager för regelförändringar och stakeholder-profiler

---
Byggt för svenska SMB som vill automatisera mötesrutiner och maximera beslutsfattande utan att tumma på compliance.
