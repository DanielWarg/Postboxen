# Postboxen Deployment Guide

## Overview

This guide covers deploying Postboxen to production environments using Docker, Kubernetes, and CI/CD pipelines.

## Prerequisites

- Docker 20.10+
- Kubernetes 1.24+
- kubectl configured
- PostgreSQL 16+
- Redis 7+
- Domain name and SSL certificates

## Quick Start with Docker Compose

### 1. Clone Repository
```bash
git clone https://github.com/DanielWarg/Postboxen.git
cd Postboxen
```

### 2. Environment Configuration
```bash
cp .env.example .env.local
# Edit .env.local with your production values
```

### 3. Start Services
```bash
docker-compose up -d
```

This will start:
- Postboxen app (port 3000)
- PostgreSQL (port 5432)
- Redis (port 6379)

## Production Deployment with Kubernetes

### 1. Create Namespace
```bash
kubectl create namespace postboxen
```

### 2. Create Secrets
```bash
kubectl create secret generic postboxen-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@db:5432/postboxen" \
  --from-literal=REDIS_URL="redis://redis:6379" \
  --from-literal=JWT_SECRET="your-super-secret-jwt-key" \
  --from-literal=SENTRY_DSN="https://your-sentry-dsn@sentry.io/project" \
  -n postboxen
```

### 3. Deploy Database
```bash
kubectl apply -f k8s/postgresql.yaml -n postboxen
```

### 4. Deploy Redis
```bash
kubectl apply -f k8s/redis.yaml -n postboxen
```

### 5. Deploy Application
```bash
kubectl apply -f k8s/deployment.yaml -n postboxen
```

### 6. Deploy Ingress
```bash
kubectl apply -f k8s/ingress.yaml -n postboxen
```

## Environment-Specific Configurations

### Development
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://dev:dev@db:5432/postboxen_dev
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    command: pnpm dev
```

### Staging
```yaml
# docker-compose.staging.yml
version: '3.8'
services:
  app:
    image: danielwarg/postboxen:staging-latest
    environment:
      - NODE_ENV=staging
      - DATABASE_URL=${STAGING_DATABASE_URL}
      - REDIS_URL=${STAGING_REDIS_URL}
      - JWT_SECRET=${STAGING_JWT_SECRET}
```

### Production
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    image: danielwarg/postboxen:production-latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${PROD_DATABASE_URL}
      - REDIS_URL=${PROD_REDIS_URL}
      - JWT_SECRET=${PROD_JWT_SECRET}
      - SENTRY_DSN=${PROD_SENTRY_DSN}
    restart: unless-stopped
```

## CI/CD Pipeline

### GitHub Actions Workflow

The project includes a complete CI/CD pipeline in `.github/workflows/ci-cd.yml`:

1. **Build & Test**: Runs linting, tests, and builds the application
2. **Deploy to Staging**: Automatically deploys to staging environment
3. **Deploy to Production**: Manual approval required for production deployment

### Manual Deployment

#### Build Docker Image
```bash
docker build -t danielwarg/postboxen:latest .
docker push danielwarg/postboxen:latest
```

#### Deploy to Kubernetes
```bash
kubectl set image deployment/postboxen-deployment \
  postboxen=danielwarg/postboxen:latest \
  -n postboxen
kubectl rollout status deployment/postboxen-deployment -n postboxen
```

## Database Migrations

### Development
```bash
pnpm db:push
```

### Production
```bash
# Run migrations in production container
kubectl exec -it deployment/postboxen-deployment -n postboxen -- pnpm db:push
```

## Monitoring & Observability

### Health Checks
The application provides health check endpoints:
- `/api/health` - Basic health status
- `/api/metrics` - Prometheus metrics

### Prometheus Configuration
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'postboxen-app'
    static_configs:
      - targets: ['postboxen-service:3000']
```

### Grafana Dashboard
Import the provided Grafana dashboard configuration for monitoring:
- API request rates and latencies
- Database connection health
- Redis cache performance
- Queue job statistics

## Security Considerations

### SSL/TLS
Ensure SSL certificates are properly configured:
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: postboxen-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - postboxen.com
    secretName: postboxen-tls
  rules:
  - host: postboxen.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: postboxen-service
            port:
              number: 3000
```

### Network Policies
```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postboxen-network-policy
spec:
  podSelector:
    matchLabels:
      app: postboxen
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: postboxen
```

## Scaling

### Horizontal Pod Autoscaling
```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: postboxen-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: postboxen-deployment
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Database Scaling
- Use PostgreSQL read replicas for read-heavy workloads
- Configure connection pooling with PgBouncer
- Monitor database performance metrics

### Redis Scaling
- Use Redis Cluster for high availability
- Configure Redis Sentinel for failover
- Monitor memory usage and eviction policies

## Backup & Recovery

### Database Backup
```bash
# Create backup
kubectl exec -it postgresql-pod -n postboxen -- \
  pg_dump -U postgres postboxen > backup.sql

# Restore backup
kubectl exec -i postgresql-pod -n postboxen -- \
  psql -U postgres postboxen < backup.sql
```

### Redis Backup
```bash
# Create Redis backup
kubectl exec -it redis-pod -n postboxen -- redis-cli BGSAVE
kubectl cp postboxen/redis-pod:/data/dump.rdb ./redis-backup.rdb
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
kubectl logs deployment/postboxen-deployment -n postboxen

# Check pod status
kubectl get pods -n postboxen

# Check events
kubectl get events -n postboxen --sort-by='.lastTimestamp'
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it deployment/postboxen-deployment -n postboxen -- \
  pnpm db:status

# Check database logs
kubectl logs deployment/postgresql-deployment -n postboxen
```

#### Redis Connection Issues
```bash
# Test Redis connectivity
kubectl exec -it deployment/postboxen-deployment -n postboxen -- \
  redis-cli -h redis ping

# Check Redis logs
kubectl logs deployment/redis-deployment -n postboxen
```

### Performance Issues

#### High CPU Usage
- Check horizontal pod autoscaler configuration
- Review application logs for inefficient queries
- Monitor database query performance

#### High Memory Usage
- Check for memory leaks in application logs
- Review Redis memory usage and eviction policies
- Monitor database connection pool size

#### Slow API Responses
- Check database query performance
- Review Redis cache hit rates
- Monitor network latency between services

## Maintenance

### Regular Tasks
- Monitor system health and performance metrics
- Review and rotate security certificates
- Update dependencies and security patches
- Backup database and Redis data
- Review and clean up old logs

### Updates
- Test updates in staging environment first
- Use blue-green deployment for zero-downtime updates
- Monitor application health after updates
- Rollback if issues are detected

## Support

For deployment support:
- **Documentation**: https://docs.postboxen.com/deployment
- **Support Email**: support@postboxen.com
- **GitHub Issues**: https://github.com/DanielWarg/Postboxen/issues
