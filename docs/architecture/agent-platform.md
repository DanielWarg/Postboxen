# Agentplattform – Nästa lager

## Översikt
Postboxens mötesagent utökas med tre lager: värdeskapande funktioner (Decision Cards, Action Router, juridisk RAG), differensierande analys (coachning, upphandlingswizard) och styrning/compliance. Arkitekturen måste därför vara modulär, händelsedriven och policy-styrd så att varje kund kan slå på rätt kapabiliteter under svensk/EU-juridik.

```
Mötesström → Händelsebuss → (Decision Engine | Action Router | RAG-motor | Coach) → Policy-motor → Export/Notifieringar
         ↘ Minneslager (TTL, persona, samtycke)
```

## Kärnkomponenter
- **EventBus (`lib/agents/events`)**: samlar möteshändelser (transkriptsegment, beslut, åtgärdslöften, samtyckesstatus) och publicerar dem till abonnenter. Under huven en in-process queue (nu) med interface för senare Kafka/Event Grid.
- **Policy Engine (`lib/agents/policy`)**: central regelmotor för samtyckesprofiler (Bas/Plus/Juridik), retention, dataklasser och vilka verktyg som får användas. Körs före varje export eller AI-kall och loggar beslut till Audit-log.
- **Memory Layer (`lib/agents/memory`)**: kortlivat mötesminne (rolling 24h), persona-cache och modul-state. Roll-scoped, kund-separerad och TTL-styrd via policy.
- **Decision Engine (`lib/agents/decision-cards`)**: analys av transkript + tasks och generering av strukturerade beslutskort med källor.
- **Action Router (`lib/agents/action-router`)**: ansvarar för att skapa uppgifter i Planner/Jira/Trello via adapterinterface och triggar på deadlines + 48h-nudgar.
- **Briefing Engine (`lib/agents/briefing`)**: genererar pre-brief 30 minuter före mötet och exec-post-brief efter sammanfattning, levererar via e-post/API.
- **Procurement Simulator (`lib/modules/procurement/simulator`)**: analyserar kravvarianter A/B och publicerar `procurement.simulation` events för upphandlingsmodulen.
- **Stakeholder Analyzer (`lib/modules/stakeholders/analyzer`)**: skapar intressentkartor och pitchförslag när en sammanfattning finns, publicerar `stakeholder.profile` events.
- **Doc-copilot (`lib/modules/documents/copilot`)**: analyserar avtal/kravtexter, genererar diff med juridiska motiveringar via `/api/agents/documents/analyze`.
- **Regulation Watcher (`lib/modules/regwatch`)**: övervakar AI Act/GDPR/LOU, publicerar `regulation.change` events och nås via `/api/agents/regwatch`.
- **Redaction Service (`lib/agents/redaction`)**: maskar PII/sekretess enligt policy innan lagring/export.
- **Citation/RAG Engine (`lib/agents/citations`, `lib/agents/rag`)**: svensk lag-index (GDPR, AI Act, LOU, NIS2, CSRD) via versionerat källregister; returnerar källor och diffar över tid.
- **Compliance (`lib/agents/compliance`)**: auditlogg, consent receipts, databoende-styrning, risknivåer för kameraanalys.

## Datamodell & flöden
1. **Ingest**: Webhook/stream levererar `MeetingEvent` (tal, reaktion, chat, beslut). EventBus validerar mot policy (får vi processa video? etc) och skickar vidare.
2. **Analys**: Decision Engine lyssnar på `speech.segment` + `decision.cue` → genererar `decision.card` med ansvarig/konsekvenser. Action Router lyssnar på `commitment` events (`"jag tar den"`).
3. **Briefing**: Briefing Engine tar metadata och memory för att skapa för-/efter-briefer och publicerar `meeting.brief` events.
4. **Redigering**: Redaction Service körs på varje transkript + export. Maskning styrs av policy (Bas = PNR, Plus = alla PII, Juridik = fulltext + källor).
5. **Sammanfattning med källor**: Orchestrator skickar transkript+kontext till AI med krav på `citations`. Citation Engine injicerar RAG-svar, policy loggar proveniens.
6. **Export & Nudging**: EventBus publicerar `action.created` → ActionRouter-executors + `notification.scheduler` som skickar 48h-påminnelse.
6. **Audit & Consent**: Varje steg loggas i AuditStore (timestamp, policybeslut, datakategori). Samtyckesprofiler definierar retention (30/90/ kundstyrt) och var datan får bo (EU/Azure).

## Extensibilitet & Module shop
- Moduler definieras som paket med: `tools`, `ragSources`, `policies`, `prompts`. Aktivering sker via ModuleRegistry som injicerar i EventBus + Policy Engine.
- Kapabiliteter exponeras via `app/api/agents/modules` (kommando för att lista/aktivera) – planeras i modulshop (SaaS upsell).

## SLO & Observabilitet
- Kostnadsvakt via `CostGuard` (budget per möte + fallback-beslut). Latensvakt med tidsouts för STT/LLM, fallback sammanfattning vid 75:e percentilen.
- Observability endpoint (OpenTelemetry) exponeras redan i `.env.example`; EventBus och Policy-motorn skickar metrics/loggar.

Denna arkitekturbas möjliggör 30/60/90-dagarsplanen: vi implementerar nu Decision Engine, Action Router, samtyckesprofiler, PII-redigering och citeringsstöd; eventbus/polismotor utgör grunden för nivå 2 och 3.
