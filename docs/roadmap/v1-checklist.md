# V1-checklista (12 tickets) - ALLA AVKLARADE ✅

## Prioriterade tickets för Fas 3 (Vecka 5-6) - KLART ✅

**Ticket A: Retention & Radera allt** ✅ **KLART!**
- ✅ BullMQ-svep för retention per samtyckesprofil (30/90/365 dagar)
- ✅ UI-knapp som triggar rensning + audit-logg + export av consent receipt
- ✅ Klar-kriterier: raderar artefakter i Postgres/objektlager, loggar hash, visar kvitto i audit-vyn

**Ticket B: Regwatch v1** ✅ **KLART!**
- ✅ Nattligt jobb som hämtar 3–5 källor (EU/SE RSS/HTML/PDF)
- ✅ Normaliserar, versionerar och skapar alerts i regwatch-vyn + ping i post-brief om relevant
- ✅ Klar-kriterier: minst 1 notifiering/vecka i staging med käll-URL och datumdiff

## Befintliga tickets (10 tickets) - ALLA AVKLARADE ✅

1. **Pre/Post-Brief Engine** ✅ **KLART!** – generera automatiska 30-minuters för-briefer och exec-post-briefs (beslut/risker/nästa steg). Output via e-post och API.
2. **Kravsimulator (Upphandling-Saga)** ✅ **KLART!** – A/B-test av krav med konkurrens/SME-score och juridiskt godkända alternativa formuleringar.
3. **Stakeholder-karta** ✅ **KLART!** – kartlägg intressen per deltagare och föreslå pitchpunkter till nästa möte.
4. **Doc-copilot med diff** ✅ **KLART!** – inline-granskning av avtal/anbud med röd/orange/grön diff + källhänvisning.
5. **Regelförändringsvakt** ✅ **KLART!** – bevaka versionerade EU/Sverige-källor och publicera alerts med föreslagen ny text.
6. **Käll-proveniens & diff** ✅ **KLART!** – säkerställ att varje rekommendation innehåller källa, versionstidstämpel och diff då/nu.
7. **Samtyckescenter** ✅ **KLART!** – UI för Bas/Plus/Juridik-profiler, signerade consent receipts och datapolicyvisning före anslutning.
8. **DLP/PII-exportfilter** ✅ **KLART!** – skapa "juridik-safe" och "kundversion"-exports med konfigurationsstyrt maskningslager.
9. **Jobbkedja för nudging** ✅ **KLART!** – ersätt `setTimeout` i Action Router med BullMQ eller Cloud Tasks; bygg retry- och persistenslager.
10. **Modulshop v1** ✅ **KLART!** – UI + backend för att toggla Juridik-Gunnar, Upphandling-Saga, HR-Eva, Ekonomi-Stefan inkl. SLA-information.

## 🎯 Status: PRODUKTIONSREDO ✅

**Alla 12 tickets är avklarade och systemet är redo för produktion!**

Varje ticket länkas mot policy/regulatorisk effekt och tidssparande KPI, redo att läggas i backloggen.