# Postboxen – AI-kollega för Teams och Zoom

Postboxen är en AI-driven möteskollega som ansluter till Teams, Zoom, Google Meet och Webex. Den dokumenterar automatiskt, skapar beslutskort, routar åtgärder och levererar färdiga sammanfattningar samt intressentinsikter, komplett med juridiska referenser. 

**🎯 Spotlight-dashboard** med fokuserad användarupplevelse - en sak i taget, allt annat håller sig lugnt i bakgrunden.

Projektet drivs i Next.js 15 (App Router) med TypeScript och pnpm.

## Funktionalitet
- **Pre/Post-Brief** – pre-brief 30 min före mötet och executive-post-brief efter avslut via `lib/agents/briefing`.
- **Decision Cards & Action Router** – beslut och “jag tar den” fångas automatiskt och skickas till Planner/Jira/Trello.
- **Stakeholder-karta** – analys av intressenter och skräddarsydda pitchförslag vid sammanfattning.
- **Doc-copilot** – diffar avtal/upphandlingstexter med motiveringar (`/api/agents/documents/analyze`).
- **Regelförändringsvakt** – bevakar AI Act/GDPR/LOU via `/api/agents/regwatch`.
- **Procurement-simulator** – A/B jämförelse av kravtexter (`/api/agents/procurement/simulate`).

## Snabbstart

### Förutsättningar
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- pnpm

### Installation
```bash
# Klona repository
git clone https://github.com/DanielWarg/Postboxen.git
cd Postboxen

# Installera dependencies
pnpm install

# Kopiera environment template
cp .env.example .env.local
```

### Databas Setup
```bash
# Skapa PostgreSQL databas
createdb postboxen

# Kör Prisma migrations
pnpm db:push
```

### Starta utvecklingsservern
```bash
pnpm dev
```
Applikationen startar på `http://localhost:3000`. Dashboardet finns på `/agents`.

### Environment Variables
Skapa `.env.local` med följande variabler:
```env
# Databas
DATABASE_URL="postgresql://evil@localhost:5432/postboxen?schema=public"
REDIS_URL="redis://localhost:6379"

# AI Services
AI_ASSISTANT_API_URL="https://api.openai.com/v1"
AI_ASSISTANT_API_KEY="your-openai-api-key"

# Säkerhet
JWT_SECRET="your-super-secret-jwt-key"
JWT_ISSUER="postboxen.com"
JWT_AUDIENCE="postboxen-users"
ALLOWED_ORIGINS="http://localhost:3000"

# Observability
SENTRY_DSN="your-sentry-dsn"
LOG_LEVEL="info"
```

## API-endpoints

### Core Agent Functions
- `POST /api/agents/schedule` – schemalägg agenten för ett möte
- `POST /api/agents/summarize` – genererar sammanfattning och kickar igång post-brief + stakeholder-analys
- `POST /api/agents/cancel` – avboka möte och stoppa alla pågående processer

### Meeting Management
- `GET /api/agents/meetings` – listar möten med pagination och filtering
- `POST /api/agents/meetings` – skapar nytt möte med persistent lagring
- `GET /api/agents/meetings/:id` – detaljer (briefer, stakeholders, audit)

### Specialized Modules
- `POST /api/agents/procurement/simulate` – kravsimulator A/B-jämförelse
- `POST /api/agents/documents/analyze` – Doc-copilot diff med källcitat
- `GET /api/agents/regwatch` – aktuella regelförändringar (AI Act/GDPR/LOU)
- `POST /api/agents/nudging` – schemalägg uppföljningsnudges

### Compliance & Retention
- `POST /api/agents/consent` – hantera samtyckesprofiler (Bas/Plus/Juridik)
- `POST /api/agents/retention` – data retention och "Radera allt"-funktionalitet
- `GET /api/agents/queues/stats` – BullMQ-köstatistik och hälsa
- `POST /api/agents/queues/dead-letter` – hantera misslyckade jobb

### Authentication
- `POST /api/auth/login` – JWT-baserad inloggning med refresh tokens
- `POST /api/auth/logout` – logga ut och rensa cookies
- `GET /api/auth/me` – hämta användarinfo
- `POST /api/auth/refresh` – förnya access token

### System Health
- `GET /api/health` – systemhälsa (databas, Redis, cache)
- `GET /api/performance/metrics` – Prometheus-format metrics (admin)
- `GET /api/metrics` – grundläggande systemmetrics

## Nya Funktioner & Förbättringar ✅

### 🎯 Spotlight Dashboard
- **Fokuserad UX**: En sak i taget - 7 spotlight-paneler (Möten, Beslut, Åtgärder, Briefs, Regwatch, Compliance, Observability)
- **KPI-strip**: Sparad tid (+14 min), uppföljning (+38%), kostnad (23 kr), mötesdisciplin (B+)
- **Kompakt läge**: Växling mellan 3-4 KPI-kort
- **Snabbåtgärder**: Bjud in Kollegan, Nudga åtgärder, Exportera post-brief
- **Hjälp-system**: Kontextuell hjälp för varje spotlight

### 🗄️ Databas & Persistens
- **PostgreSQL**: Fullständig Prisma schema med 10 tabeller (Meeting, DecisionCard, ActionItem, MeetingBrief, Stakeholder, etc.)
- **DatabaseStore**: Ersätter MemoryStore med persistent lagring i PostgreSQL
- **Meeting Repository**: CRUD-operationer för möten via `lib/db/repositories/meetings.ts`
- **API Integration**: POST/GET `/api/agents/meetings` fungerar med databas

### ⚡ Redis & Performance
- **Rate Limiting**: Redis-baserad rate limiting (100 req/15min GET, 10 req POST)
- **Caching Service**: Generisk cache med TTL och pattern-invalidering
- **Job Queues**: BullMQ-integration för meeting-processing, briefing och notifications
- **Redis Client**: Robust Redis-klient med fallback när Redis inte är tillgänglig

### 🔒 Säkerhet & Robusthet
- **APIError Class**: Strukturerad felhantering med HTTP-statuskoder
- **Rate Limit Enforcement**: IP-baserad rate limiting med Redis-counters
- **Graceful Degradation**: Systemet fungerar även när Redis/PostgreSQL inte är tillgänglig
- **Error Handling**: Robust felhantering i alla API-endpoints

### 🔐 Authentication & Authorization
- **JWT Authentication**: Säker token-baserad autentisering med bcryptjs
- **Refresh Tokens**: Automatisk token-förnyelse för förbättrad säkerhet
- **Login Attempt Tracking**: Account locking efter 5 misslyckade försök
- **Security Middleware**: Rate limiting, max request size, timeout protection
- **Audit Logging**: Strukturerad loggning av säkerhetshändelser

### 🚀 CI/CD & Deployment
- **GitHub Actions**: Automatiserad testing, building och deployment
- **Docker Support**: Multi-stage Dockerfile för optimerad produktionsbild
- **Kubernetes**: Deployment-konfiguration med health checks och resource limits
- **Monitoring**: Prometheus/Grafana integration för observability
- **Health Checks**: `/api/health` endpoint för systemhälsa

### 📊 Observability & Monitoring
- **Structured Logging**: Console-baserad logging med correlation IDs
- **Performance Metrics**: Prometheus-format metrics för API-latens och databasqueries
- **Error Reporting**: Sentry-integration för felrapportering
- **Queue Monitoring**: BullMQ-statistik med Dead Letter Queue support
- **Database Optimization**: Optimerade queries med performance tracking

### 🧪 Testing & Quality
- **Jest Test Suite**: Unit och integration tests för alla kritiska komponenter
- **API Testing**: Supertest för endpoint-testning
- **Mock Support**: Mockade externa API:er för pålitlig testing
- **Coverage Reports**: Test coverage tracking och reporting
- **TypeScript**: Fullständig typsäkerhet genom hela applikationen

### 🔄 Queue Robusthet
- **Dead Letter Queue**: Hantering av misslyckade jobb med retry-logik
- **Idempotency Keys**: Förhindrar duplicering av jobb
- **Exponential Backoff**: Intelligent retry-strategi för transienta fel
- **Queue Dashboard**: UI för övervakning av köstatus och DLQ-hantering
- **Job Monitoring**: Real-time statistik för alla BullMQ-köer

## Arkitektur

### Core Components
- **Agent Platform**: `lib/agents/*` - Orchestrator, Decision Cards, Briefing Engine, Policy Engine
- **Integrations**: `lib/integrations/providers/*` - Teams, Zoom, Google Meet, Webex adapters
- **Modules**: `lib/modules/*` - Stakeholder Analyzer, Doc-copilot, Procurement Simulator, Regwatch
- **Database**: PostgreSQL med Prisma ORM för persistent lagring
- **Cache & Queues**: Redis för caching och BullMQ för job processing

### Frontend
- **Spotlight Dashboard**: `/agents` - Fokuserad användarupplevelse med 7 spotlight-paneler
- **Marketing Landing**: `/` - Svensk SME-fokuserad landningssida
- **Component Library**: `components/ui/*` - shadcn/ui baserad design system

### API Structure
- **Agent APIs**: `/api/agents/*` - Core agent functionality
- **Auth APIs**: `/api/auth/*` - JWT-baserad autentisering
- **System APIs**: `/api/health`, `/api/metrics` - Systemhälsa och monitoring

### Documentation
- **Architecture**: `docs/architecture/` - Systemarkitektur och designbeslut
- **Modules**: `docs/modules/` - Detaljerad dokumentation av alla moduler
- **Roadmap**: `docs/roadmap/` - Produktionsplan och utvecklingsroadmap

## Utveckling
- Paketmanager: `pnpm`
- Kodstil: `pnpm lint`
- Viktiga moduler: Briefing Engine, Decision Cards, Stakeholder Analyzer, Doc Copilot, Regulation Watcher.

## Produktionsstatus

### ✅ Klart för produktion
- **Backend**: Komplett API med PostgreSQL, Redis, BullMQ
- **Frontend**: Spotlight-dashboard med professionell UX
- **Säkerhet**: JWT-autentisering, rate limiting, audit logging
- **Performance**: Caching, optimerade queries, pagination
- **CI/CD**: GitHub Actions, Docker, Kubernetes deployment
- **Testing**: Jest test suite med coverage tracking
- **Monitoring**: Health checks, metrics, structured logging

### 🚀 Nästa steg (valfria förbättringar)
- **Teams/Zoom Marketplace**: SSO/SAML/SCIM integration
- **Slash Commands**: Power user-funktioner för Teams/Zoom
- **Magic Invite UI**: Onboarding med "magisk länk"
- **Advanced Analytics**: Djupare insights och rapporter
- **Modulshop v1**: Specialiserade agenter (Juridik-Gunnar, Upphandling-Saga, HR-Eva, Ekonomi-Stefan)

---
Byggt för svenska SMB som vill automatisera mötesrutiner och maximera beslutsfattande utan att tumma på compliance.
