# 🚨 Release Checklista: Epic 90-Day Plan

## 📋 Pre-Release Checklist

### ✅ Code Quality
- [ ] Alla PR:er har godkänts av minst 2 reviewers
- [ ] Code coverage ≥ 80% för nya features
- [ ] Linting passerar utan fel
- [ ] TypeScript compilation utan fel
- [ ] Security scan passerar (Snyk/SonarQube)

### ✅ Testing
- [ ] Unit tests: alla nya features har unit tests
- [ ] Integration tests: API endpoints testade
- [ ] E2E tests: happy path + minst 1 felväg
- [ ] Performance tests: latens och throughput
- [ ] Load tests: systemet hanterar förväntad belastning

### ✅ Database
- [ ] Migrations testade i staging
- [ ] Backout-plan dokumenterad och testad
- [ ] Database backup skapad innan release
- [ ] Index-optimering för nya queries

### ✅ Monitoring & Observability
- [ ] Metrics implementerade för alla nya features
- [ ] Dashboards uppdaterade med nya panels
- [ ] Alerting-regler konfigurerade
- [ ] Log aggregation fungerar för nya events

### ✅ Security & Privacy
- [ ] Inga nya scopes utan motivering
- [ ] PII-maskning verifierad i logs
- [ ] Audit events skapas för alla actions
- [ ] GDPR-compliance verifierad

---

## 🚀 Release Process

### Phase 1: Staging Deployment
- [ ] Deploy till staging environment
- [ ] Feature flags: **ON** i staging
- [ ] Smoke tests körs automatiskt
- [ ] Manual testing av alla 5 features
- [ ] Performance benchmarking

### Phase 2: Canary Release (10%)
- [ ] Deploy till production med feature flags **OFF**
- [ ] Aktivera för 10% av tenants
- [ ] Monitor metrics i 2 timmar
- [ ] Verifiera att error rates är normala
- [ ] Kontrollera att SLO:er hålls

### Phase 3: Gradual Rollout (50% → 100%)
- [ ] Öka till 50% av tenants
- [ ] Monitor i 4 timmar
- [ ] Öka till 100% av tenants
- [ ] Monitor i 24 timmar
- [ ] Verifiera att alla features fungerar

### Phase 4: Post-Release
- [ ] Dokumentera eventuella issues
- [ ] Uppdatera runbooks
- [ ] Samla feedback från användare
- [ ] Planera nästa iteration

---

## 🎯 Feature-Specific Checklists

### PR #1: Decision-Close Card
- [ ] Adaptive Cards fungerar i Teams/Zoom
- [ ] Planner/Jira/Trello integration testad
- [ ] Idempotens verifierad (inga dubletter)
- [ ] Decision coverage ≥ 90%
- [ ] Fallback till post-brief fungerar

### PR #2: Doc-Copilot v1
- [ ] Diff-motor fungerar korrekt
- [ ] Källcitering är korrekt
- [ ] PII-maskning verifierad
- [ ] "Infoga i dokument" fungerar
- [ ] Performance acceptable för stora dokument

### PR #3: Regwatch Push
- [ ] Relevansfilter fungerar
- [ ] Irrelevanta träffar tystas
- [ ] Post-brief integration fungerar
- [ ] Friendly diff är läsbar
- [ ] Källlänkar fungerar

### PR #4: Model Router
- [ ] Policy-utvärdering fungerar
- [ ] Budget-tak respekteras
- [ ] Downgrade-logik fungerar
- [ ] Kostnadsindikator visas korrekt
- [ ] Shadow-mode logging fungerar

### PR #5: Degrade Mode
- [ ] Join-fel detekteras korrekt
- [ ] Post-analysis triggas automatiskt
- [ ] Vänlig banner visas
- [ ] Ingen data tappas
- [ ] Recovery-strategier fungerar

---

## 📊 Success Criteria

### KPI:er att uppnå
- [ ] **Sparad tid/möte**: ≥ 25 min (idag ~14)
- [ ] **Åtgärder klara inom 48h**: ≥ 70% (idag ~38%)
- [ ] **Källciterat**: 100% av alla förslag
- [ ] **Decision coverage**: ≥ 90% av beslut har ägare+deadline
- [ ] **Error rate**: < 1% för alla nya features
- [ ] **Latens p95**: < 90s för recap

### Alerting Thresholds
- [ ] Decision coverage < 90% → Alert
- [ ] Doc-copilot error rate > 5% → Alert
- [ ] Regwatch false positive rate > 20% → Alert
- [ ] Model router budget exceeded → Alert
- [ ] Degrade mode failure rate > 10% → Alert

---

## 🔧 Rollback Plan

### Immediate Rollback (0-5 min)
- [ ] Feature flags: **OFF** för alla features
- [ ] Verifiera att systemet återgår till tidigare beteende
- [ ] Monitor error rates och latens

### Database Rollback (5-15 min)
- [ ] Kör down-migrations om nödvändigt
- [ ] Verifiera att data-integritet bevaras
- [ ] Testa att systemet fungerar med gamla schema

### Full Rollback (15-30 min)
- [ ] Deploy tidigare version av koden
- [ ] Verifiera att alla features fungerar
- [ ] Dokumentera vad som gick fel
- [ ] Planera fix för nästa release

---

## 📞 Emergency Contacts

### On-Call Engineer
- **Primary**: [Name] - [Phone] - [Email]
- **Secondary**: [Name] - [Phone] - [Email]

### Escalation
- **Team Lead**: [Name] - [Phone] - [Email]
- **Product Manager**: [Name] - [Phone] - [Email]
- **DevOps**: [Name] - [Phone] - [Email]

### Communication Channels
- **Slack**: #postboxen-releases
- **Email**: releases@postboxen.com
- **Status Page**: https://status.postboxen.com

---

## 📝 Post-Release Tasks

### Within 24 hours
- [ ] Samla feedback från användare
- [ ] Analysera metrics och KPI:er
- [ ] Dokumentera eventuella issues
- [ ] Uppdatera dokumentation

### Within 1 week
- [ ] Retrospektiv med teamet
- [ ] Planera nästa iteration
- [ ] Optimera baserat på feedback
- [ ] Uppdatera runbooks

---

**Denna checklista säkerställer en säker och framgångsrik release!** 🚀
