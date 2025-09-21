#!/bin/bash

# Production Deployment Script for Postboxen
# This script handles the complete deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="postboxen-prod"
IMAGE_TAG="${1:-latest}"
REGISTRY="danielwarg/postboxen"

echo -e "${BLUE}🚀 Starting Postboxen Production Deployment${NC}"
echo -e "${BLUE}Image Tag: ${IMAGE_TAG}${NC}"
echo -e "${BLUE}Namespace: ${NAMESPACE}${NC}"

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

if ! command_exists docker; then
    echo -e "${RED}❌ docker is not installed${NC}"
    exit 1
fi

# Check if namespace exists
if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
    echo -e "${YELLOW}📦 Creating namespace ${NAMESPACE}...${NC}"
    kubectl create namespace "$NAMESPACE"
fi

# Build and push Docker image
echo -e "${YELLOW}🐳 Building Docker image...${NC}"
docker build -f Dockerfile.production -t "$REGISTRY:$IMAGE_TAG" .

echo -e "${YELLOW}📤 Pushing Docker image...${NC}"
docker push "$REGISTRY:$IMAGE_TAG"

# Apply Kubernetes configurations
echo -e "${YELLOW}⚙️  Applying Kubernetes configurations...${NC}"

# Apply namespace first
kubectl apply -f k8s/production/namespace.yaml

# Apply secrets (you need to create these manually)
echo -e "${YELLOW}🔐 Please ensure secrets are created in namespace ${NAMESPACE}${NC}"
echo -e "${YELLOW}   Run: kubectl create secret generic postboxen-prod-secrets --from-env-file=.env.production -n ${NAMESPACE}${NC}"

# Apply other configurations
kubectl apply -f k8s/production/configmap.yaml
kubectl apply -f k8s/production/postgres.yaml
kubectl apply -f k8s/production/redis.yaml
kubectl apply -f k8s/production/deployment.yaml
kubectl apply -f k8s/production/hpa.yaml
kubectl apply -f k8s/production/ingress.yaml
kubectl apply -f k8s/production/monitoring.yaml

# Wait for deployments
echo -e "${YELLOW}⏳ Waiting for deployments to be ready...${NC}"

echo -e "${BLUE}   Waiting for PostgreSQL...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres-prod -n "$NAMESPACE" --timeout=300s

echo -e "${BLUE}   Waiting for Redis...${NC}"
kubectl wait --for=condition=ready pod -l app=redis-prod -n "$NAMESPACE" --timeout=300s

echo -e "${BLUE}   Waiting for Application...${NC}"
kubectl wait --for=condition=ready pod -l app=postboxen-prod -n "$NAMESPACE" --timeout=300s

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
kubectl exec -it deployment/postboxen-prod -n "$NAMESPACE" -- pnpm db:push

# Health check
echo -e "${YELLOW}🏥 Performing health check...${NC}"
kubectl exec -it deployment/postboxen-prod -n "$NAMESPACE" -- curl -f http://localhost:3000/api/health

# Get service information
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}📊 Deployment Information:${NC}"

echo -e "${BLUE}Pods:${NC}"
kubectl get pods -n "$NAMESPACE"

echo -e "${BLUE}Services:${NC}"
kubectl get services -n "$NAMESPACE"

echo -e "${BLUE}Ingress:${NC}"
kubectl get ingress -n "$NAMESPACE"

# Get application URL
INGRESS_HOST=$(kubectl get ingress postboxen-prod-ingress -n "$NAMESPACE" -o jsonpath='{.spec.rules[0].host}')
if [ -n "$INGRESS_HOST" ]; then
    echo -e "${GREEN}🌐 Application URL: https://${INGRESS_HOST}${NC}"
fi

echo -e "${GREEN}🎉 Production deployment completed!${NC}"
