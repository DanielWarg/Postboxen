# 🚀 Release-kommentar mall (för PR-merge)

## ✅ Pre-merge Checklist

### Code Quality
- [ ] **Build**: `pnpm build` passerar utan fel
- [ ] **Tests**: `pnpm test:ci` grönt (unit + integration)
- [ ] **E2E**: `pnpm test:e2e` grönt (simplified tests)
- [ ] **Linting**: `pnpm lint` passerar utan fel
- [ ] **TypeScript**: Inga compilation errors

### Database & Migrations
- [ ] **Migrations**: `pnpm exec prisma migrate deploy` testad i staging
- [ ] **Backout**: Down-migration eller soft-delete plan finns
- [ ] **Backup**: Database backup skapad innan merge
- [ ] **Indexes**: Nya queries optimerade

### Feature Flags & Environment
- [ ] **Feature flag**: Implementerad och dokumenterad
- [ ] **Environment vars**: Uppdaterade i `.env.example`
- [ ] **Staging**: Feature ON för testing
- [ ] **Production**: Feature OFF (default)

### Monitoring & Observability
- [ ] **Metrics**: Implementerade för nya features
- [ ] **Dashboards**: Uppdaterade med nya panels
- [ ] **Alerting**: Regler konfigurerade
- [ ] **Logs**: Strukturerade utan PII

### Security & Privacy
- [ ] **Scopes**: Inga nya OAuth scopes utan motivering
- [ ] **PII**: Maskning verifierad i logs
- [ ] **Audit**: Events skapas för alla actions
- [ ] **GDPR**: Compliance verifierad

---

## 🎯 Feature-Specific Checklist

### PR #1: Decision-Close Card
- [ ] **Adaptive Cards**: Testad i Teams/Zoom
- [ ] **Task Creation**: Planner/Jira/Trello integration fungerar
- [ ] **Idempotens**: Inga dubletter skapas
- [ ] **Fallback**: Post-brief fungerar om kortet avvisas
- [ ] **Decision Coverage**: Mätbar via metrics

### PR #2: Doc-Copilot v1
- [ ] **Diff Engine**: Insertion/deletion/replace fungerar
- [ ] **Citations**: Källhänvisningar korrekta
- [ ] **PII Masking**: Ingen känslig data i logs
- [ ] **Insert Function**: "Infoga i dokument" fungerar
- [ ] **Performance**: Acceptabel för stora dokument

### PR #3: Regwatch Push
- [ ] **Relevance Filter**: Matchar mötets ämnen
- [ ] **Noise Reduction**: Irrelevanta träffar tystas
- [ ] **Post-brief Integration**: Notiser visas korrekt
- [ ] **Friendly Diff**: Läsbar presentation
- [ ] **Source Links**: Fungerar korrekt

### PR #4: Model Router
- [ ] **Policy Evaluation**: Mötestyp → modellval fungerar
- [ ] **Budget Limits**: Per möte/tenant respekteras
- [ ] **Downgrade Logic**: Automatisk nedgradering fungerar
- [ ] **Cost Indicator**: UI visar kostnad korrekt
- [ ] **Shadow Mode**: Logging fungerar i staging

### PR #5: Degrade Mode
- [ ] **Join Failure Detection**: Detekterar fel korrekt
- [ ] **Post-Analysis Trigger**: Automatisk efterhandsanalys
- [ ] **User Banner**: Vänlig meddelande visas
- [ ] **Data Preservation**: Ingen data tappas
- [ ] **Recovery**: Återhämtning från degrade mode

---

## 📊 Success Metrics

### KPI:er att mäta
- [ ] **Decision Coverage**: ≥ 90% av beslut har ägare+deadline
- [ ] **Doc-Copilot Adoption**: % möten som använder doc-copilot
- [ ] **Regwatch Relevance**: % relevanta notiser vs totala
- [ ] **Model Router Efficiency**: Kostnad per möte, latens p95
- [ ] **Degrade Mode Success**: % möten som återhämtar sig

### Alerting Thresholds
- [ ] **Decision Coverage**: < 90% → Alert
- [ ] **Doc-Copilot Error Rate**: > 5% → Alert
- [ ] **Regwatch False Positive**: > 20% → Alert
- [ ] **Model Router Budget**: Exceeded → Alert
- [ ] **Degrade Mode Failure**: > 10% → Alert

---

## 🚨 Rollback Plan

### Immediate Rollback (0-5 min)
- [ ] **Feature Flag**: Set to OFF
- [ ] **Verify**: System returns to previous behavior
- [ ] **Monitor**: Error rates and latency

### Database Rollback (5-15 min)
- [ ] **Down Migration**: Run if necessary
- [ ] **Data Integrity**: Verify preservation
- [ ] **Test**: System works with old schema

### Full Rollback (15-30 min)
- [ ] **Code Deploy**: Previous version
- [ ] **Verify**: All features work
- [ ] **Document**: What went wrong
- [ ] **Plan**: Fix for next release

---

## 📞 On-Call Information

### Primary On-Call
- **Name**: [Name]
- **Phone**: [Phone]
- **Email**: [Email]
- **Slack**: @[username]

### Escalation
- **Team Lead**: [Name] - [Phone]
- **Product Manager**: [Name] - [Phone]
- **DevOps**: [Name] - [Phone]

### Communication Channels
- **Slack**: #postboxen-releases
- **Email**: releases@postboxen.com
- **Status Page**: https://status.postboxen.com

---

## 🎯 Go/No-Go Decision

### Ready to Ship?
- [ ] **All checkboxes above**: ✅ Completed
- [ ] **Staging testing**: ✅ Passed
- [ ] **Performance**: ✅ Within SLO
- [ ] **Security review**: ✅ Approved
- [ ] **On-call ready**: ✅ Available

### Decision
- [ ] **✅ SHIP IT** - All criteria met
- [ ] **❌ HOLD** - Issues found, need fixes

### If HOLD
- [ ] **Issues**: List specific problems
- [ ] **Timeline**: When will fixes be ready
- [ ] **Next Review**: Schedule follow-up

---

**Copy-paste denna mall i varje PR-merge för konsistent kvalitet!** 🚀
