# Modulshop & SLA

| Modul | Persona | Innehåll | SLA | Prisidé |
| --- | --- | --- | --- | --- |
| Juridik-Gunnar | Jurist | GDPR, AI Act, LOU, NIS2, CSRD + mallformuleringar | Kräver uppdatering varje 30:e dag, svarstid < 5s | 1 990 kr/mån
| Upphandling-Saga | Upphandlare | Kravsimulator, överimplementeringsvarningar, förslag på viktning | Kravdiff under 10s, källor i 100% av svar | 2 490 kr/mån
| HR-Eva | HR | Policyförslag, medarbetarprocesser, arbetsrätt | Svarstid < 4s, uppdatering varje 60:e dag | 1 490 kr/mån
| Ekonomi-Stefan | CFO | Budgetscenarion, kassaflödesvarningar, KPI-tolkning | Svarstid < 4s, datakälla uppdateras dagligen | 1 490 kr/mån

## Modulstruktur
- `modules/<namn>/manifest.json` (planerad) beskriver verktyg, RAG-källor, policykrav och pris.
- Varje modul exponerar en `register`-funktion som kopplas in via `ensureAgentBootstrap()`.
- SLA monitoreras via EventBus metrics (`module.latency`, `module.success_rate`). Breach -> incident Slack + automatisk kompensation.

## Kundupplevelse
1. Admin går till "Modulshop" i portalen.
2. Väljer modul, ser SLA, källor, pris och databehandling.
3. Aktiverar -> billing API, modul registreras, policy-motorn uppdateras.
4. Modul kan pausas eller downgradeas utan dataförlust (minne TTL hanterar).

## Kommande tillägg
- Modulcertifiering (intern + extern) med kontrollista.
- Partnerverktyg via EventBus (ERP/CRM) med revenue share.
- Sandbox-läge där moduler kan testas mot historiska möten utan export.
