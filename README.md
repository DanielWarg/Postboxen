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
Applikationen startar på `http://localhost:3000`. 

### Databas Setup
```bash
# Skapa PostgreSQL databas
createdb postboxen

# Kör Prisma migrations
pnpm db:push
```

En `.env.local` behövs med följande variabler:
```env
DATABASE_URL="postgresql://evil@localhost:5432/postboxen?schema=public"
REDIS_URL="redis://localhost:6379"
AI_ASSISTANT_API_URL="https://api.openai.com/v1"
AI_ASSISTANT_API_KEY="your-openai-api-key"
```

## API-endpoints
- `POST /api/agents/schedule` – schemalägg agenten för ett möte.
- `POST /api/agents/summarize` – genererar sammanfattning och kickar igång post-brief + stakeholder-analys.
- `GET /api/agents/meetings` / `POST /api/agents/meetings` – listar och skapar möten med persistent lagring.
- `GET /api/agents/meetings/:id` – detaljer (briefer, stakeholders, audit).
- `POST /api/agents/procurement/simulate` – kravsimulator A/B.
- `POST /api/agents/documents/analyze` – Doc-copilot diff.
- `GET /api/agents/regwatch` – aktuella regelförändringar.

## Nya Funktioner ✅

### Databas & Persistens
- **PostgreSQL**: Fullständig Prisma schema med 10 tabeller
- **Persistent Storage**: Alla möten, beslut och åtgärder sparas permanent
- **DatabaseStore**: Ersätter MemoryStore för produktionsklarhet

### Redis & Performance  
- **Rate Limiting**: 100 req/15min (GET), 10 req (POST) per IP
- **Caching**: TTL-baserad cache för förbättrad prestanda
- **Job Queues**: BullMQ för asynkron bearbetning av möten och briefing

### Säkerhet & Robusthet
- **APIError Handling**: Strukturerad felhantering med HTTP-statuskoder
- **Graceful Degradation**: Fungerar även när Redis/PostgreSQL inte är tillgänglig
- **Input Validation**: Zod-validering på alla endpoints

## Arkitektur
- **Agents & Events**: `lib/agents/*`, `lib/modules/*` bygger på EventBus med policy/memory-lager.
- **Dokumentation**: `docs/architecture/agent-platform.md`, `docs/modules/*.md`, `docs/roadmap/*`.
- **UI**: marknadslandning i `app/page.tsx` med svensk SME-fokus.

## Utveckling
- Paketmanager: `pnpm`
- Kodstil: `pnpm lint`
- Viktiga moduler: Briefing Engine, Decision Cards, Stakeholder Analyzer, Doc Copilot, Regulation Watcher.

## Nästa steg
- **Frontend Dashboard**: UI för Decision Cards, Briefs och Meeting timeline
- **Authentication**: JWT-baserad autentisering och auktorisering
- **Testing Suite**: Automatiserade tester för alla komponenter
- **Monitoring**: Observability, metrics och alerting
- **Modulshop v1**: Juridik-Gunnar, Upphandling-Saga, HR-Eva, Ekonomi-Stefan

---
Byggt för svenska SMB som vill automatisera mötesrutiner och maximera beslutsfattande utan att tumma på compliance.
