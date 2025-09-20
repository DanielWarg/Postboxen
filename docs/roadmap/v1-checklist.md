# V1-checklista (12 tickets)

## Prioriterade tickets för Fas 3 (Vecka 5-6)

**Ticket A: Retention & Radera allt**
- BullMQ-svep för retention per samtyckesprofil (30/90/365 dagar)
- UI-knapp som triggar rensning + audit-logg + export av consent receipt
- Klar-kriterier: raderar artefakter i Postgres/objektlager, loggar hash, visar kvitto i audit-vyn

**Ticket B: Regwatch v1**
- Nattligt jobb som hämtar 3–5 källor (EU/SE RSS/HTML/PDF)
- Normaliserar, versionerar och skapar alerts i regwatch-vyn + ping i post-brief om relevant
- Klar-kriterier: minst 1 notifiering/vecka i staging med käll-URL och datumdiff

## Befintliga tickets (10 tickets)

1. **Pre/Post-Brief Engine** – generera automatiska 30-minuters för-briefer och exec-post-briefs (beslut/risker/nästa steg). Output via e-post och API.
2. **Kravsimulator (Upphandling-Saga)** – A/B-test av krav med konkurrens/SME-score och juridiskt godkända alternativa formuleringar.
3. **Stakeholder-karta** – kartlägg intressen per deltagare och föreslå pitchpunkter till nästa möte.
4. **Doc-copilot med diff** – inline-granskning av avtal/anbud med röd/orange/grön diff + källhänvisning.
5. **Regelförändringsvakt** – bevaka versionerade EU/Sverige-källor och publicera alerts med föreslagen ny text.
6. **Käll-proveniens & diff** – säkerställ att varje rekommendation innehåller källa, versionstidstämpel och diff då/nu.
7. **Samtyckescenter** – UI för Bas/Plus/Juridik-profiler, signerade consent receipts och datapolicyvisning före anslutning.
8. **DLP/PII-exportfilter** – skapa "juridik-safe" och "kundversion"-exports med konfigurationsstyrt maskningslager.
9. **Jobbkedja för nudging** – ersätt `setTimeout` i Action Router med BullMQ eller Cloud Tasks; bygg retry- och persistenslager.
10. **Modulshop v1** – UI + backend för att toggla Juridik-Gunnar, Upphandling-Saga, HR-Eva, Ekonomi-Stefan inkl. SLA-information.

Varje ticket länkas mot policy/regulatorisk effekt och tidssparande KPI, redo att läggas i backloggen.
