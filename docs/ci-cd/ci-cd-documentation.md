# CI/CD Pipeline Documentation - Postboxen Agent Platform

## Översikt
Denna dokumentation beskriver CI/CD-pipelinen för Postboxen Agent Platform, inklusive automatiserad testing, deployment och monitoring.

## Pipeline-steg

### 1. Lint & Type Check
- **Trigger**: Vid varje push och pull request
- **Syfte**: Säkerställer kodkvalitet och typ-säkerhet
- **Steg**:
  - ESLint-kontroll
  - TypeScript type checking
  - Code formatting validation

### 2. Test Suite
- **Trigger**: Efter lyckad lint-kontroll
- **Syfte**: Kör alla unit- och integration-tester
- **Services**:
  - PostgreSQL 15 (test database)
  - Redis 7 (test cache)
- **Steg**:
  - Installera dependencies
  - Kör databasmigrationer
  - Kör test suite
  - Generera coverage report
  - Ladda upp coverage till Codecov

### 3. Build Application
- **Trigger**: Efter lyckad test suite
- **Syfte**: Bygger produktionsversion av applikationen
- **Steg**:
  - Installera dependencies
  - Bygg applikation med `pnpm build`
  - Ladda upp build artifacts

### 4. Security Scan
- **Trigger**: Parallellt med test suite
- **Syfte**: Säkerhetsgenomgång av dependencies
- **Steg**:
  - npm audit
  - Snyk security scan
  - Vulnerability assessment

### 5. E2E Tests
- **Trigger**: Efter lyckad build
- **Syfte**: End-to-end testing av applikationen
- **Services**:
  - PostgreSQL 15 (E2E database)
  - Redis 7 (E2E cache)
- **Steg**:
  - Ladda ner build artifacts
  - Starta applikation
  - Kör E2E-tester

### 6. Deploy to Staging
- **Trigger**: Vid push till `develop` branch
- **Syfte**: Deployment till staging-miljö
- **Steg**:
  - Ladda ner build artifacts
  - Deploy till staging
  - Kör smoke tests

### 7. Deploy to Production
- **Trigger**: Vid push till `main` branch
- **Syfte**: Deployment till produktionsmiljö
- **Steg**:
  - Ladda ner build artifacts
  - Deploy till production
  - Kör health checks
  - Skicka deployment notifications

### 8. Performance Tests
- **Trigger**: Efter staging deployment
- **Syfte**: Prestandatestning
- **Steg**:
  - Kör load tests
  - Generera performance report

## Deployment-strategier

### Staging Deployment
```bash
# Automatisk deployment vid push till develop
git push origin develop
```

### Production Deployment
```bash
# Automatisk deployment vid push till main
git push origin main
```

### Manual Deployment
```bash
# Manuell deployment via GitHub Actions
# Gå till Actions tab -> CI/CD Pipeline -> Run workflow
```

## Environment Variables

### Staging
```bash
NODE_ENV=staging
DATABASE_URL=postgresql://staging-db/postboxen
REDIS_URL=redis://staging-redis:6379
JWT_SECRET=staging-jwt-secret
AI_ASSISTANT_API_URL=https://staging-api.assistant.com
```

### Production
```bash
NODE_ENV=production
DATABASE_URL=postgresql://prod-db/postboxen
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=production-jwt-secret
AI_ASSISTANT_API_URL=https://api.assistant.com
```

## Docker Deployment

### Lokal utveckling
```bash
# Starta alla services
docker-compose up -d

# Visa logs
docker-compose logs -f app

# Stoppa services
docker-compose down
```

### Production deployment
```bash
# Bygg Docker image
docker build -t postboxen:latest .

# Kör container
docker run -d \
  --name postboxen-app \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://prod-db/postboxen \
  -e REDIS_URL=redis://prod-redis:6379 \
  postboxen:latest
```

## Kubernetes Deployment

### Deploy till Kubernetes
```bash
# Skapa secrets
kubectl create secret generic postboxen-secrets \
  --from-literal=database-url=postgresql://prod-db/postboxen \
  --from-literal=redis-url=redis://prod-redis:6379 \
  --from-literal=jwt-secret=production-jwt-secret

# Deploy application
kubectl apply -f k8s/deployment.yaml

# Kontrollera status
kubectl get pods -l app=postboxen
kubectl get services -l app=postboxen
```

### Scaling
```bash
# Skala upp/down
kubectl scale deployment postboxen-app --replicas=5

# Kontrollera HPA
kubectl get hpa postboxen-hpa
```

## Monitoring & Observability

### Health Checks
- **Endpoint**: `/api/health`
- **Checks**: Database, Redis, Cache
- **Response**: JSON med health status

### Metrics
- **Endpoint**: `/api/metrics`
- **Format**: Prometheus format
- **Metrics**: API requests, response times, error rates

### Logging
- **Format**: Structured JSON logs
- **Levels**: error, warn, info, debug
- **Correlation**: X-Correlation-ID header

## Rollback-strategier

### Docker Rollback
```bash
# Lista images
docker images postboxen

# Rollback till tidigare version
docker run -d \
  --name postboxen-app \
  -p 3000:3000 \
  postboxen:previous-version
```

### Kubernetes Rollback
```bash
# Lista deployments
kubectl rollout history deployment/postboxen-app

# Rollback till tidigare version
kubectl rollout undo deployment/postboxen-app

# Rollback till specifik version
kubectl rollout undo deployment/postboxen-app --to-revision=2
```

## Troubleshooting

### Vanliga problem

#### Build failures
```bash
# Kontrollera dependencies
pnpm install

# Kör linting manuellt
pnpm lint

# Kör type checking
pnpm tsc --noEmit
```

#### Test failures
```bash
# Kör tester lokalt
pnpm test

# Kör med coverage
pnpm test:coverage

# Kör specifika tester
pnpm test -- --testNamePattern="auth"
```

#### Deployment failures
```bash
# Kontrollera logs
kubectl logs -f deployment/postboxen-app

# Kontrollera events
kubectl get events --sort-by=.metadata.creationTimestamp

# Kontrollera pod status
kubectl describe pod <pod-name>
```

### Debugging

#### Lokal debugging
```bash
# Starta med debug mode
NODE_ENV=development pnpm dev

# Kör med verbose logging
LOG_LEVEL=debug pnpm start
```

#### Production debugging
```bash
# Kör pod i debug mode
kubectl exec -it <pod-name> -- /bin/sh

# Kontrollera environment variables
kubectl exec <pod-name> -- env
```

## Best Practices

### Code Quality
- Alla commits måste passera linting
- Test coverage måste vara >80%
- Alla pull requests måste ha reviews

### Security
- Dependencies skannas automatiskt
- Secrets hanteras via Kubernetes secrets
- Alla endpoints har rate limiting

### Performance
- Build artifacts cachas
- Docker images optimeras med multi-stage builds
- Kubernetes HPA för automatisk skalning

### Monitoring
- Health checks på alla endpoints
- Metrics samlas in automatiskt
- Alerts för kritiska fel

## Nästa Steg

1. **Implementera Blue-Green deployment** för zero-downtime updates
2. **Lägg till Canary deployments** för gradvis rollout
3. **Implementera automated rollback** vid fel
4. **Förbättra monitoring** med custom dashboards
5. **Lägg till performance testing** i pipeline

---

**Dokument version**: 1.0  
**Senast uppdaterad**: $(date)  
**Nästa granskning**: $(date -d "+1 month")
