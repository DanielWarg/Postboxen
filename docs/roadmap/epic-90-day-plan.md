# 🚀 Episka 90-dagars planen: MVP → AWESOME

## 🎯 Hårda mål (3 kritiska KPI:er)

* **Mer värde:** ≥ 25 min sparad per möte (idag ~14)
* **Mer säkerhet:** ≥ 70% av åtgärder klara inom 48h (idag ~38%)
* **Mer förtroende:** 100% källciterat + raderbart, 0 blockerande fel i möten

## 📅 30/60/90 dagar roadmap

### **0–30 dagar (WOW & polish)**
1. **Decision-Close Card** - Adaptive Card + Planner/Jira integration
2. **Doc-Copilot v1** - Diff + källor + "Infoga i dokument"
3. **Regwatch Push** - Relevansmatch + friendly diff i Post-brief
4. **Model Router** - Policy + budget per möte + kostnadsindikator
5. **Degrade Mode** - Vid join-fel → efterhandsanalys

### **31–60 dagar (Reliability & trust)**
6. **SLO & felbudget** - Recap < 90s (p95), Join success > 99%
7. **Compliance Center v2** - "Radera allt" + exportpaket
8. **Global sök "beslut-först"** - Fråga: "Vad beslutade vi om X i maj?"
9. **Marketplace & IT-klar** - Teams/Zoom app-listning, SSO/SAML

### **61–90 dagar (Moats & scale)**
10. **Stakeholder-insikter** - Taltid/avbrott/tempo på team-nivå
11. **Procurement-simulator** - SME-killer med risk/poäng-simulering
12. **"Brief of Briefs"** - Ledningsläge med veckovy
13. **Partner-hookar** - Modulshop-mallar, webhook/Zapier

## 🎯 Top 10 tickets (börja idag)

### **PR #1: Decision-Close Card** 
- **Branch:** `feature/decision-close-card`
- **Mål:** Adaptive Card + route till Planner/Jira
- **Klar när:** 100% beslut har ägare+deadline före mötesslut
- **Status:** ✅ Stub skapad

### **PR #2: Doc-Copilot v1**
- **Branch:** `feature/doc-copilot-v1`
- **Mål:** Diff-motor + "Infoga i dokument"
- **Klar när:** Sidopanel för anbud/avtal med källcitering
- **Status:** ✅ Stub skapad

### **PR #3: Regwatch Push**
- **Branch:** `feature/regwatch-push`
- **Mål:** Relevansmatch på mötets ämnen → post-brief-tegel
- **Klar när:** Friendly diff + tysta irrelevanta träffar
- **Status:** ✅ Stub skapad

### **PR #4: Model Router**
- **Branch:** `feature/model-router`
- **Mål:** Policy + budget per möte, mät tokens/kostnad i UI
- **Klar när:** Snabb/billig vs djupanalys on-demand
- **Status:** ✅ Stub skapad

### **PR #5: Degrade Mode**
- **Branch:** `feature/degrade-mode`
- **Mål:** Vid join-fel → efterhandsanalys utan manuell insats
- **Klar när:** Auto-degradering + recovery-strategier
- **Status:** ✅ Stub skapad

### **PR #6: SLO & Felbudget** (nästa batch)
- **Mål:** OTel + Sentry + /metrics med p95 recap/latens/fel
- **Klar när:** SLO: Recap < 90s, Join success > 99%

### **PR #7: Compliance Export** (nästa batch)
- **Mål:** PDF/JSON-kvitto (consent+audit) med hash
- **Klar när:** "Radera allt" med förhands-estimat

### **PR #8: Global Sök v1** (nästa batch)
- **Mål:** Index + beslut-först-API + UI-fält i headern
- **Klar när:** "Vad beslutade vi om X i maj?" → länkar till citat

### **PR #9: Stakeholder-panel v1** (nästa batch)
- **Mål:** Aggregerad taltid/avbrott (ej individ)
- **Klar när:** Team-nivå insights + coachande tips

### **PR #10: "Brief of Briefs" vy** (nästa batch)
- **Mål:** Ledningspanel vecka
- **Klar när:** 5 största risker, blockare, deadlines tvärs alla möten

## 🎨 Designprinciper (premium-känsla)

* **Spotlight först:** allt sekundärt två klick bort
* **Tre primära actions, max:** på varje vy (ingen meny-spaghetti)
* **Alltid källor & kvitton:** varje råd/diff/citat har källa
* **Ljudlöst smart:** inga pop-ups, bara toppade kort i rätt stund

## 📊 KPI-panel (mät att vi blev awesome)

* **Sparad tid/möte** • **48h-genomförande** • **Join-success** • **Recap p95** • **Kostnad/möte** • **Raderings/retention-events** • **"Decision coverage"** (% beslut med ägare+deadline)

## 🚀 Nästa steg

1. **Teamet kan börja checka in kod direkt** på de 5 branches
2. **Varje PR har komplett stub** med implementation plan
3. **Acceptance criteria** definierade för varje feature
4. **Database schema** och API endpoints planerade
5. **Test strategy** inkluderad för varje PR

**Alla branches är redo för utveckling!** 🎯✨
