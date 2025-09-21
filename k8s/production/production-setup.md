# Production Environment Setup

## Overview
This guide covers setting up Postboxen in a production environment with proper security, monitoring, and scalability.

## Prerequisites
- Kubernetes cluster (1.24+)
- PostgreSQL 16+ with SSL
- Redis 7+ with persistence
- Domain name with SSL certificates
- Docker registry access

## 1. Environment Configuration

### Production Environment Variables
```bash
# Database
DATABASE_URL="postgresql://postboxen_prod:secure_password@postgres-prod:5432/postboxen_prod?sslmode=require"

# Redis
REDIS_URL="rediss://redis-prod:6380"
REDIS_PASSWORD="secure_redis_password"

# Security
JWT_SECRET="your-super-secure-jwt-secret-minimum-64-characters-long"
JWT_ISSUER="postboxen.com"
JWT_AUDIENCE="postboxen-users"
ALLOWED_ORIGINS="https://postboxen.com,https://app.postboxen.com"

# AI Services
AI_ASSISTANT_API_URL="https://api.openai.com/v1"
AI_ASSISTANT_API_KEY="your-production-openai-key"
AI_ASSISTANT_WEBHOOK_SECRET="your-webhook-secret"

# Observability
SENTRY_DSN="https://your-production-sentry-dsn@sentry.io/project"
SENTRY_RELEASE="1.0.0"
LOG_LEVEL="warn"
OBSERVABILITY_ENDPOINT="https://observability.postboxen.com"

# Meeting Platform Integrations
TEAMS_CLIENT_ID="your-teams-client-id"
TEAMS_CLIENT_SECRET="your-teams-client-secret"
TEAMS_TENANT_ID="your-teams-tenant-id"

ZOOM_CLIENT_ID="your-zoom-client-id"
ZOOM_CLIENT_SECRET="your-zoom-client-secret"
ZOOM_WEBHOOK_SECRET="your-zoom-webhook-secret"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

WEBEX_CLIENT_ID="your-webex-client-id"
WEBEX_CLIENT_SECRET="your-webex-client-secret"

# External Integrations
PLANNER_CLIENT_ID="your-planner-client-id"
PLANNER_CLIENT_SECRET="your-planner-client-secret"

JIRA_BASE_URL="https://yourcompany.atlassian.net"
JIRA_USERNAME="your-jira-username"
JIRA_API_TOKEN="your-jira-api-token"

TRELLO_API_KEY="your-trello-api-key"
TRELLO_API_TOKEN="your-trello-api-token"

# Production Settings
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED="1"
PORT="3000"
```

## 2. Kubernetes Production Deployment

### Namespace
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: postboxen-prod
  labels:
    name: postboxen-prod
    environment: production
```

### Secrets
```bash
# Create production secrets
kubectl create secret generic postboxen-prod-secrets \
  --from-literal=DATABASE_URL="postgresql://postboxen_prod:secure_password@postgres-prod:5432/postboxen_prod?sslmode=require" \
  --from-literal=REDIS_URL="rediss://redis-prod:6380" \
  --from-literal=REDIS_PASSWORD="secure_redis_password" \
  --from-literal=JWT_SECRET="your-super-secure-jwt-secret-minimum-64-characters-long" \
  --from-literal=AI_ASSISTANT_API_KEY="your-production-openai-key" \
  --from-literal=SENTRY_DSN="https://your-production-sentry-dsn@sentry.io/project" \
  --from-literal=TEAMS_CLIENT_SECRET="your-teams-client-secret" \
  --from-literal=ZOOM_CLIENT_SECRET="your-zoom-client-secret" \
  --from-literal=GOOGLE_CLIENT_SECRET="your-google-client-secret" \
  --from-literal=WEBEX_CLIENT_SECRET="your-webex-client-secret" \
  --from-literal=PLANNER_CLIENT_SECRET="your-planner-client-secret" \
  --from-literal=JIRA_API_TOKEN="your-jira-api-token" \
  --from-literal=TRELLO_API_TOKEN="your-trello-api-token" \
  -n postboxen-prod
```

### ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postboxen-prod-config
  namespace: postboxen-prod
data:
  JWT_ISSUER: "postboxen.com"
  JWT_AUDIENCE: "postboxen-users"
  ALLOWED_ORIGINS: "https://postboxen.com,https://app.postboxen.com"
  AI_ASSISTANT_API_URL: "https://api.openai.com/v1"
  LOG_LEVEL: "warn"
  NODE_ENV: "production"
  NEXT_TELEMETRY_DISABLED: "1"
  PORT: "3000"
```

### PostgreSQL Production
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres-prod
  namespace: postboxen-prod
spec:
  serviceName: postgres-prod
  replicas: 1
  selector:
    matchLabels:
      app: postgres-prod
  template:
    metadata:
      labels:
        app: postgres-prod
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        env:
        - name: POSTGRES_DB
          value: "postboxen_prod"
        - name: POSTGRES_USER
          value: "postboxen_prod"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postboxen-prod-secrets
              key: DATABASE_URL
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postboxen_prod
            - -d
            - postboxen_prod
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postboxen_prod
            - -d
            - postboxen_prod
          initialDelaySeconds: 5
          periodSeconds: 5
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 100Gi
      storageClassName: fast-ssd
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-prod
  namespace: postboxen-prod
spec:
  selector:
    app: postgres-prod
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
```

### Redis Production
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-prod
  namespace: postboxen-prod
spec:
  serviceName: redis-prod
  replicas: 1
  selector:
    matchLabels:
      app: redis-prod
  template:
    metadata:
      labels:
        app: redis-prod
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        command:
        - redis-server
        - --requirepass
        - $(REDIS_PASSWORD)
        - --appendonly
        - "yes"
        - --appendfsync
        - "everysec"
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postboxen-prod-secrets
              key: REDIS_PASSWORD
        ports:
        - containerPort: 6379
        volumeMounts:
        - name: redis-storage
          mountPath: /data
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          exec:
            command:
            - redis-cli
            - -a
            - $(REDIS_PASSWORD)
            - ping
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - redis-cli
            - -a
            - $(REDIS_PASSWORD)
            - ping
          initialDelaySeconds: 5
          periodSeconds: 5
  volumeClaimTemplates:
  - metadata:
      name: redis-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi
      storageClassName: fast-ssd
---
apiVersion: v1
kind: Service
metadata:
  name: redis-prod
  namespace: postboxen-prod
spec:
  selector:
    app: redis-prod
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
```

### Application Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postboxen-prod
  namespace: postboxen-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: postboxen-prod
  template:
    metadata:
      labels:
        app: postboxen-prod
    spec:
      containers:
      - name: postboxen
        image: danielwarg/postboxen:production-latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: postboxen-prod-secrets
        - configMapRef:
            name: postboxen-prod-config
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
---
apiVersion: v1
kind: Service
metadata:
  name: postboxen-prod-service
  namespace: postboxen-prod
spec:
  selector:
    app: postboxen-prod
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

### Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: postboxen-prod-hpa
  namespace: postboxen-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: postboxen-prod
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Ingress with SSL
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: postboxen-prod-ingress
  namespace: postboxen-prod
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
spec:
  tls:
  - hosts:
    - postboxen.com
    - app.postboxen.com
    secretName: postboxen-prod-tls
  rules:
  - host: postboxen.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: postboxen-prod-service
            port:
              number: 80
  - host: app.postboxen.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: postboxen-prod-service
            port:
              number: 80
```

## 3. Database Migration

### Run Migrations
```bash
# Run database migrations in production
kubectl exec -it deployment/postboxen-prod -n postboxen-prod -- pnpm db:push

# Verify database connection
kubectl exec -it deployment/postboxen-prod -n postboxen-prod -- pnpm db:status
```

## 4. Monitoring Setup

### Prometheus ServiceMonitor
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: postboxen-prod-monitor
  namespace: postboxen-prod
spec:
  selector:
    matchLabels:
      app: postboxen-prod
  endpoints:
  - port: http
    path: /api/metrics
    interval: 30s
```

### Grafana Dashboard
Import the provided Grafana dashboard configuration for production monitoring.

## 5. Security Hardening

### Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postboxen-prod-network-policy
  namespace: postboxen-prod
spec:
  podSelector:
    matchLabels:
      app: postboxen-prod
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: postboxen-prod
    ports:
    - protocol: TCP
      port: 5432
    - protocol: TCP
      port: 6379
  - to: []
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 80
```

### Pod Security Policy
```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: postboxen-prod-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

## 6. Backup Strategy

### Database Backup
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: postboxen-prod
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:16-alpine
            command:
            - /bin/bash
            - -c
            - |
              pg_dump -h postgres-prod -U postboxen_prod postboxen_prod > /backup/postboxen_$(date +%Y%m%d_%H%M%S).sql
              gzip /backup/postboxen_$(date +%Y%m%d_%H%M%S).sql
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postboxen-prod-secrets
                  key: DATABASE_URL
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

## 7. Deployment Commands

### Deploy to Production
```bash
# Apply all configurations
kubectl apply -f k8s/production/ -n postboxen-prod

# Wait for deployment
kubectl rollout status deployment/postboxen-prod -n postboxen-prod

# Check pod status
kubectl get pods -n postboxen-prod

# Check logs
kubectl logs -f deployment/postboxen-prod -n postboxen-prod
```

### Update Application
```bash
# Update image
kubectl set image deployment/postboxen-prod postboxen=danielwarg/postboxen:production-v1.1.0 -n postboxen-prod

# Rollout status
kubectl rollout status deployment/postboxen-prod -n postboxen-prod

# Rollback if needed
kubectl rollout undo deployment/postboxen-prod -n postboxen-prod
```

## 8. Health Checks

### Application Health
```bash
# Check application health
curl -f https://postboxen.com/api/health

# Check metrics
curl -f https://postboxen.com/api/metrics
```

### Database Health
```bash
# Check database connection
kubectl exec -it deployment/postboxen-prod -n postboxen-prod -- pnpm db:status
```

## 9. Troubleshooting

### Common Issues
- **Pod CrashLoopBackOff**: Check logs and resource limits
- **Database Connection Issues**: Verify secrets and network policies
- **SSL Certificate Issues**: Check cert-manager and ingress configuration
- **Memory Issues**: Monitor HPA and adjust resource limits

### Logs
```bash
# Application logs
kubectl logs -f deployment/postboxen-prod -n postboxen-prod

# Database logs
kubectl logs -f statefulset/postgres-prod -n postboxen-prod

# Redis logs
kubectl logs -f statefulset/redis-prod -n postboxen-prod
```

## 10. Maintenance

### Regular Tasks
- Monitor resource usage and scale as needed
- Update dependencies and security patches
- Review and rotate secrets
- Backup verification
- Performance optimization

### Updates
- Test updates in staging first
- Use blue-green deployment for zero downtime
- Monitor application health after updates
- Have rollback plan ready
