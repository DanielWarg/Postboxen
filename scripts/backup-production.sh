#!/bin/bash

# Production Backup Script for Postboxen
# This script creates backups of the production database and Redis data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="postboxen-prod"
BACKUP_DIR="/backups/postboxen"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}💾 Starting Postboxen Production Backup${NC}"
echo -e "${BLUE}Timestamp: ${TIMESTAMP}${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command_exists kubectl; then
    echo -e "${RED}❌ kubectl is not installed${NC}"
    exit 1
fi

# Check if namespace exists
if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
    echo -e "${RED}❌ Namespace ${NAMESPACE} does not exist${NC}"
    exit 1
fi

# Database backup
echo -e "${YELLOW}🗄️  Creating database backup...${NC}"

# Get PostgreSQL pod name
POSTGRES_POD=$(kubectl get pods -n "$NAMESPACE" -l app=postgres-prod -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POSTGRES_POD" ]; then
    echo -e "${RED}❌ PostgreSQL pod not found${NC}"
    exit 1
fi

# Create database backup
kubectl exec -n "$NAMESPACE" "$POSTGRES_POD" -- pg_dump -U postboxen_prod postboxen_prod > "$BACKUP_DIR/postboxen_db_${TIMESTAMP}.sql"

# Compress database backup
gzip "$BACKUP_DIR/postboxen_db_${TIMESTAMP}.sql"
echo -e "${GREEN}✅ Database backup created: postboxen_db_${TIMESTAMP}.sql.gz${NC}"

# Redis backup
echo -e "${YELLOW}🔴 Creating Redis backup...${NC}"

# Get Redis pod name
REDIS_POD=$(kubectl get pods -n "$NAMESPACE" -l app=redis-prod -o jsonpath='{.items[0].metadata.name}')

if [ -z "$REDIS_POD" ]; then
    echo -e "${RED}❌ Redis pod not found${NC}"
    exit 1
fi

# Create Redis backup
kubectl exec -n "$NAMESPACE" "$REDIS_POD" -- redis-cli --rdb /data/dump.rdb
kubectl cp "$NAMESPACE/$REDIS_POD:/data/dump.rdb" "$BACKUP_DIR/postboxen_redis_${TIMESTAMP}.rdb"

echo -e "${GREEN}✅ Redis backup created: postboxen_redis_${TIMESTAMP}.rdb${NC}"

# Application configuration backup
echo -e "${YELLOW}⚙️  Creating configuration backup...${NC}"

# Backup ConfigMap
kubectl get configmap postboxen-prod-config -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/postboxen_config_${TIMESTAMP}.yaml"

# Backup Secrets (without sensitive data)
kubectl get secret postboxen-prod-secrets -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/postboxen_secrets_${TIMESTAMP}.yaml"

echo -e "${GREEN}✅ Configuration backup created${NC}"

# Create backup manifest
cat > "$BACKUP_DIR/backup_manifest_${TIMESTAMP}.txt" << EOF
Postboxen Production Backup
==========================
Timestamp: ${TIMESTAMP}
Date: $(date)
Namespace: ${NAMESPACE}

Files Created:
- postboxen_db_${TIMESTAMP}.sql.gz (Database backup)
- postboxen_redis_${TIMESTAMP}.rdb (Redis backup)
- postboxen_config_${TIMESTAMP}.yaml (ConfigMap backup)
- postboxen_secrets_${TIMESTAMP}.yaml (Secrets backup)

Backup Size:
$(du -h "$BACKUP_DIR"/*${TIMESTAMP}* | awk '{print $2 ": " $1}')

Restore Instructions:
1. Database: kubectl exec -i <postgres-pod> -- psql -U postboxen_prod postboxen_prod < postboxen_db_${TIMESTAMP}.sql.gz
2. Redis: kubectl cp postboxen_redis_${TIMESTAMP}.rdb <redis-pod>:/data/dump.rdb
3. Config: kubectl apply -f postboxen_config_${TIMESTAMP}.yaml
4. Secrets: kubectl apply -f postboxen_secrets_${TIMESTAMP}.yaml
EOF

echo -e "${GREEN}✅ Backup manifest created: backup_manifest_${TIMESTAMP}.txt${NC}"

# Cleanup old backups (keep last 7 days)
echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"
find "$BACKUP_DIR" -name "postboxen_*" -type f -mtime +7 -delete
echo -e "${GREEN}✅ Old backups cleaned up${NC}"

# Summary
echo -e "${GREEN}🎉 Backup completed successfully!${NC}"
echo -e "${BLUE}📊 Backup Summary:${NC}"
echo -e "${BLUE}   Location: ${BACKUP_DIR}${NC}"
echo -e "${BLUE}   Timestamp: ${TIMESTAMP}${NC}"
echo -e "${BLUE}   Files created:${NC}"
ls -la "$BACKUP_DIR"/*${TIMESTAMP}* | awk '{print "   " $9 " (" $5 " bytes)"}'

echo -e "${BLUE}💡 To restore from this backup, see: backup_manifest_${TIMESTAMP}.txt${NC}"
