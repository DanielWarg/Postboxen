# 🚀 Production Environment Variables

## Feature Flags (Alltid av i prod först – slå på i staging)

```bash
# Feature toggles
FEATURE_DECISION_CLOSE_CARD=0
FEATURE_DOC_COPILOT_V1=0
FEATURE_REGWATCH_PUSH=0
FEATURE_MODEL_ROUTER=0
FEATURE_DEGRADE_MODE=1   # ha skyddsnätet PÅ

# Router/kostnad
ROUTER_DEFAULT_TIER=fast   # fast|balanced|deep
ROUTER_BUDGET_PER_MEETING=35   # SEK
ROUTER_BUDGET_WARNING_THRESHOLD=0.8
ROUTER_AUTO_DOWNGRADE=true

# Compliance/retention
RETENTION_CRON="0 3 * * *"     # kör nattligt svep
DATA_RESIDENCY=eu
DELETE_ALL_REQUIRE_CONFIRM=true
RETENTION_DAYS_BASIC=30
RETENTION_DAYS_PLUS=90
RETENTION_DAYS_JURIDIK=365

# Observability
SENTRY_DSN=your-sentry-dsn-here
SENTRY_RELEASE=your-release-version
OTEL_EXPORTER_OTLP_ENDPOINT=your-otel-endpoint-here
PROM_PUSHGATEWAY_URL=your-prometheus-pushgateway-here
LOG_LEVEL=info

# Database & Redis
DATABASE_URL=postgresql://user:password@localhost:5432/postboxen
REDIS_URL=redis://localhost:6379

# AI Assistant
AI_ASSISTANT_API_URL=your-ai-assistant-url
AI_ASSISTANT_API_KEY=your-ai-assistant-key
AI_ASSISTANT_WEBHOOK_SECRET=your-webhook-secret

# Authentication
JWT_SECRET=your-jwt-secret
JWT_ISSUER=postboxen
JWT_AUDIENCE=postboxen-users
ALLOWED_ORIGINS=https://postboxen.com,https://app.postboxen.com

# Test-only (måste vara AV i prod)
E2E_BYPASS_AUTH=0
NODE_ENV=production
```

## Staging Environment Variables

```bash
# Feature toggles (alla ON för testing)
FEATURE_DECISION_CLOSE_CARD=1
FEATURE_DOC_COPILOT_V1=1
FEATURE_REGWATCH_PUSH=1
FEATURE_MODEL_ROUTER=1
FEATURE_DEGRADE_MODE=1

# Router/kostnad (låga gränser för testing)
ROUTER_DEFAULT_TIER=fast
ROUTER_BUDGET_PER_MEETING=10   # låg gräns för testing
ROUTER_BUDGET_WARNING_THRESHOLD=0.5
ROUTER_AUTO_DOWNGRADE=true

# Compliance/retention (korta perioder för testing)
RETENTION_CRON="0 3 * * *"
DATA_RESIDENCY=eu
DELETE_ALL_REQUIRE_CONFIRM=false   # enklare för testing
RETENTION_DAYS_BASIC=7
RETENTION_DAYS_PLUS=14
RETENTION_DAYS_JURIDIK=30

# Observability
SENTRY_DSN=your-staging-sentry-dsn
SENTRY_RELEASE=staging
OTEL_EXPORTER_OTLP_ENDPOINT=your-staging-otel-endpoint
PROM_PUSHGATEWAY_URL=your-staging-prometheus-pushgateway
LOG_LEVEL=debug

# Database & Redis
DATABASE_URL=postgresql://user:password@localhost:5432/postboxen_staging
REDIS_URL=redis://localhost:6379/1

# AI Assistant
AI_ASSISTANT_API_URL=your-staging-ai-assistant-url
AI_ASSISTANT_API_KEY=your-staging-ai-assistant-key
AI_ASSISTANT_WEBHOOK_SECRET=your-staging-webhook-secret

# Authentication
JWT_SECRET=your-staging-jwt-secret
JWT_ISSUER=postboxen-staging
JWT_AUDIENCE=postboxen-staging-users
ALLOWED_ORIGINS=https://staging.postboxen.com

# Test-only (ON för staging)
E2E_BYPASS_AUTH=1
NODE_ENV=staging
```

## Development Environment Variables

```bash
# Feature toggles (alla ON för development)
FEATURE_DECISION_CLOSE_CARD=1
FEATURE_DOC_COPILOT_V1=1
FEATURE_REGWATCH_PUSH=1
FEATURE_MODEL_ROUTER=1
FEATURE_DEGRADE_MODE=1

# Router/kostnad (ingen gräns för development)
ROUTER_DEFAULT_TIER=fast
ROUTER_BUDGET_PER_MEETING=1000   # hög gräns för development
ROUTER_BUDGET_WARNING_THRESHOLD=0.9
ROUTER_AUTO_DOWNGRADE=false

# Compliance/retention (ingen retention för development)
RETENTION_CRON=""
DATA_RESIDENCY=eu
DELETE_ALL_REQUIRE_CONFIRM=false
RETENTION_DAYS_BASIC=0
RETENTION_DAYS_PLUS=0
RETENTION_DAYS_JURIDIK=0

# Observability
SENTRY_DSN=your-dev-sentry-dsn
SENTRY_RELEASE=development
OTEL_EXPORTER_OTLP_ENDPOINT=your-dev-otel-endpoint
PROM_PUSHGATEWAY_URL=your-dev-prometheus-pushgateway
LOG_LEVEL=debug

# Database & Redis
DATABASE_URL=postgresql://user:password@localhost:5432/postboxen_dev
REDIS_URL=redis://localhost:6379/2

# AI Assistant
AI_ASSISTANT_API_URL=your-dev-ai-assistant-url
AI_ASSISTANT_API_KEY=your-dev-ai-assistant-key
AI_ASSISTANT_WEBHOOK_SECRET=your-dev-webhook-secret

# Authentication
JWT_SECRET=your-dev-jwt-secret
JWT_ISSUER=postboxen-dev
JWT_AUDIENCE=postboxen-dev-users
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Test-only (ON för development)
E2E_BYPASS_AUTH=1
NODE_ENV=development
```

## Kill-Switch Commands

### Immediate Feature Disable
```bash
# Disable all features immediately
FEATURE_DECISION_CLOSE_CARD=0
FEATURE_DOC_COPILOT_V1=0
FEATURE_REGWATCH_PUSH=0
FEATURE_MODEL_ROUTER=0
FEATURE_DEGRADE_MODE=1   # keep safety net ON
```

### Router Emergency
```bash
# Force all requests to use fast tier
ROUTER_DEFAULT_TIER=fast
ROUTER_AUTO_DOWNGRADE=true
ROUTER_BUDGET_PER_MEETING=5   # very low limit
```

### Degrade Mode Emergency
```bash
# Force all meetings to post-analysis
FEATURE_DEGRADE_MODE=1
DEGRADE_FORCE_ALL=true
DEGRADE_RETRY_ATTEMPTS=0
```

## Environment-Specific Notes

### Production
- **Security**: All secrets rotated regularly
- **Monitoring**: Full observability stack
- **Backup**: Daily database backups
- **Scaling**: Auto-scaling enabled
- **SSL**: Full SSL/TLS encryption

### Staging
- **Testing**: All features enabled for testing
- **Data**: Synthetic test data only
- **Monitoring**: Reduced observability
- **Backup**: Weekly backups
- **Scaling**: Manual scaling

### Development
- **Debugging**: Full debug logging
- **Data**: Local test data
- **Monitoring**: Minimal observability
- **Backup**: No automated backups
- **Scaling**: Single instance

---

**Copy-paste dessa miljövariabler för säker deployment!** 🚀
