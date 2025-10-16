#!/bin/bash
# Week 1 Deployment Execution Script
# Orchestrates the complete Week 1 deployment process

set -e

# Configuration
REGISTRY="${DOCKER_REGISTRY:-vextrus}"
VERSION="week1-prod"
STAGING_NAMESPACE="vextrus-staging"
PRODUCTION_NAMESPACE="vextrus-production"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display section header
section() {
  echo
  echo -e "${BLUE}=================================="
  echo -e "$1"
  echo -e "==================================${NC}"
  echo
}

# Function to run command with logging
run_step() {
  local step_name=$1
  local command=$2

  echo -e "${YELLOW}→ $step_name${NC}"
  if eval "$command"; then
    echo -e "${GREEN}✓ $step_name completed${NC}"
    return 0
  else
    echo -e "${RED}✗ $step_name failed${NC}"
    exit 1
  fi
}

# Start deployment
echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║  Finance Service Week 1 Deployment    ║"
echo "║  Security Fixes + 10% Traffic Split   ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Confirm start
echo "This will deploy the Finance service with Week 1 security fixes."
echo "Deployment strategy: 10% canary traffic + 90% stable"
echo
read -p "Are you ready to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Deployment cancelled."
  exit 0
fi

# Phase 1: Build Docker Image
section "Phase 1: Build Docker Image (5 minutes)"

cd ..  # Move to finance service root

echo "Building production-optimized Docker image..."
run_step "Docker build" "docker build -t $REGISTRY/finance:$VERSION -f Dockerfile --target production ."

echo "Tagging image for registry..."
run_step "Docker tag" "docker tag $REGISTRY/finance:$VERSION $REGISTRY/finance:week1-staging"

echo "Pushing to registry..."
run_step "Docker push (staging)" "docker push $REGISTRY/finance:week1-staging"
run_step "Docker push (production)" "docker push $REGISTRY/finance:$VERSION"

echo -e "${GREEN}Phase 1 Complete: Docker image built and pushed${NC}"

# Phase 2: Deploy to Staging
section "Phase 2: Deploy to Staging (10 minutes)"

cd k8s  # Back to k8s directory

echo "Deploying to staging namespace..."
run_step "Apply staging deployment" "kubectl apply -f 01-staging-deployment.yaml"

echo "Waiting for staging rollout to complete..."
run_step "Wait for rollout" "kubectl rollout status deployment/finance-service-staging -n $STAGING_NAMESPACE --timeout=5m"

echo "Checking pod status..."
kubectl get pods -n $STAGING_NAMESPACE -l app=finance-service

echo -e "${GREEN}Phase 2 Complete: Staging deployment successful${NC}"

# Phase 3: Run Staging Smoke Tests
section "Phase 3: Run Staging Smoke Tests (5 minutes)"

# Check if JWT token is set
if [ -z "$STAGING_JWT_TOKEN" ]; then
  echo -e "${YELLOW}⚠ STAGING_JWT_TOKEN not set${NC}"
  echo "Please set your staging JWT token:"
  read -p "STAGING_JWT_TOKEN: " STAGING_JWT_TOKEN
  export STAGING_JWT_TOKEN
fi

echo "Running smoke tests on staging..."
chmod +x 04-smoke-tests.sh

if ./04-smoke-tests.sh staging; then
  echo -e "${GREEN}Phase 3 Complete: All staging smoke tests passed${NC}"
else
  echo -e "${RED}Phase 3 Failed: Smoke tests failed${NC}"
  echo "Please investigate staging issues before proceeding to production."
  echo "Check logs: kubectl logs -f deployment/finance-service-staging -n $STAGING_NAMESPACE"
  exit 1
fi

# Pause before production
echo
echo -e "${YELLOW}Staging validation complete. Ready for production deployment.${NC}"
read -p "Proceed to production? (yes/no): " PROD_CONFIRM

if [ "$PROD_CONFIRM" != "yes" ]; then
  echo "Production deployment cancelled. Staging remains deployed."
  exit 0
fi

# Phase 4: Production Deployment
section "Phase 4: Production Deployment - 10% Traffic (15 minutes)"

echo "Deploying canary to production (10% traffic)..."
run_step "Apply production canary" "kubectl apply -f 02-production-week1-canary.yaml"

echo "Waiting for canary rollout..."
run_step "Wait for canary rollout" "kubectl rollout status deployment/finance-service-week1 -n $PRODUCTION_NAMESPACE --timeout=5m"

echo "Setting up monitoring..."
run_step "Apply monitoring stack" "kubectl apply -f 03-monitoring-serviceMonitor.yaml"

echo "Checking pod distribution..."
kubectl get pods -n $PRODUCTION_NAMESPACE -l app=finance-service

echo "Verifying service endpoints..."
kubectl get service finance-service -n $PRODUCTION_NAMESPACE

echo -e "${GREEN}Phase 4 Complete: Production canary deployed${NC}"

# Phase 5: Production Smoke Tests
section "Phase 5: Production Smoke Tests (5 minutes)"

# Check if JWT token is set
if [ -z "$PROD_JWT_TOKEN" ]; then
  echo -e "${YELLOW}⚠ PROD_JWT_TOKEN not set${NC}"
  echo "Please set your production JWT token:"
  read -p "PROD_JWT_TOKEN: " PROD_JWT_TOKEN
  export PROD_JWT_TOKEN
fi

echo "Running smoke tests on production canary..."

if ./04-smoke-tests.sh production; then
  echo -e "${GREEN}Phase 5 Complete: All production smoke tests passed${NC}"
else
  echo -e "${RED}Phase 5 Failed: Production smoke tests failed${NC}"
  echo
  echo -e "${YELLOW}Rollback options:${NC}"
  echo "1. Scale down canary: kubectl scale deployment/finance-service-week1 -n $PRODUCTION_NAMESPACE --replicas=0"
  echo "2. Delete canary: kubectl delete deployment finance-service-week1 -n $PRODUCTION_NAMESPACE"
  echo "3. Rollback: kubectl rollout undo deployment/finance-service-week1 -n $PRODUCTION_NAMESPACE"
  exit 1
fi

# Deployment Complete
section "🎉 Week 1 Deployment Complete!"

echo -e "${GREEN}All phases completed successfully!${NC}"
echo
echo "Deployment Summary:"
echo "  ✅ Docker image built and pushed"
echo "  ✅ Staging deployment verified"
echo "  ✅ Staging smoke tests passed"
echo "  ✅ Production canary deployed (10% traffic)"
echo "  ✅ Production smoke tests passed"
echo "  ✅ Monitoring configured"
echo
echo "Current Status:"
kubectl get pods -n $PRODUCTION_NAMESPACE -l app=finance-service
echo
echo -e "${BLUE}Next Steps (48-Hour Monitoring):${NC}"
echo
echo "1. Monitor Grafana Dashboard:"
echo "   https://grafana.vextrus.com/d/finance-week1"
echo
echo "2. Watch Prometheus Alerts:"
echo "   kubectl get prometheusrules -n $PRODUCTION_NAMESPACE finance-service-week1-alerts"
echo
echo "3. Check pod health regularly:"
echo "   kubectl get pods -n $PRODUCTION_NAMESPACE -l version=week1"
echo
echo "4. Monitor logs:"
echo "   kubectl logs -f deployment/finance-service-week1 -n $PRODUCTION_NAMESPACE"
echo
echo "5. Monitor metrics:"
echo "   - Error rate target: <0.5%"
echo "   - P95 latency target: <500ms"
echo "   - Pod restarts: 0"
echo
echo -e "${YELLOW}Monitoring Schedule:${NC}"
echo "  Hour 0-6:   Check every 15-30 minutes"
echo "  Hour 6-24:  Check every hour"
echo "  Hour 24-48: Check every 2 hours"
echo
echo "If issues arise, run: ./k8s/rollback-week1.sh"
echo
echo -e "${GREEN}Deployment complete! Week 1 is now live with 10% traffic.${NC}"
