#!/bin/bash
# Week 1 Pre-Deployment Verification Checklist
# Run this script BEFORE executing deployment to verify all prerequisites

set -e

echo "=================================="
echo "Week 1 Pre-Deployment Verification"
echo "=================================="
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Function to check requirement
check_requirement() {
  local test_name=$1
  local command=$2

  echo -n "Checking: $test_name ... "

  if eval "$command" &>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

echo "1. Infrastructure Access"
echo "========================"

# Check kubectl access
check_requirement "Kubernetes cluster access" "kubectl cluster-info"

# Check namespaces
check_requirement "Staging namespace exists" "kubectl get namespace vextrus-staging"
check_requirement "Production namespace exists" "kubectl get namespace vextrus-production"

echo

echo "2. Docker Registry"
echo "=================="

# Check Docker
check_requirement "Docker daemon running" "docker info"

# Check Docker registry access (customize this URL)
echo -n "Checking: Docker registry access ... "
if docker pull alpine:latest &>/dev/null; then
  echo -e "${GREEN}✓ PASS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}⚠ WARNING${NC} (Check registry credentials)"
  FAILED=$((FAILED + 1))
fi

echo

echo "3. Kubernetes Secrets"
echo "====================="

# Check staging secrets
check_requirement "Staging database secret" "kubectl get secret finance-db-staging -n vextrus-staging"
check_requirement "Staging app secrets" "kubectl get secret finance-secrets-staging -n vextrus-staging"

# Check production secrets
check_requirement "Production database secret" "kubectl get secret finance-db-production -n vextrus-production"
check_requirement "Production app secrets" "kubectl get secret finance-secrets-production -n vextrus-production"

echo

echo "4. Monitoring Stack"
echo "==================="

# Check Prometheus
check_requirement "Prometheus available" "kubectl get service prometheus -n monitoring || kubectl get service prometheus-kube-prometheus-prometheus -n monitoring"

# Check Grafana
check_requirement "Grafana available" "kubectl get service grafana -n monitoring"

# Check ServiceMonitor CRD
check_requirement "ServiceMonitor CRD installed" "kubectl get crd servicemonitors.monitoring.coreos.com"

echo

echo "5. Required Services"
echo "===================="

# Check PostgreSQL
check_requirement "PostgreSQL available" "kubectl get service postgres-production -n vextrus-production || kubectl get pods -l app=postgresql -n vextrus-production"

# Check EventStore
check_requirement "EventStore available" "kubectl get service eventstore-production -n vextrus-production || kubectl get pods -l app=eventstore -n vextrus-production"

# Check Kafka
check_requirement "Kafka available" "kubectl get service kafka-production-0 -n vextrus-production || kubectl get pods -l app=kafka -n vextrus-production"

echo

echo "6. Stable Version"
echo "================="

# Check if stable deployment exists
echo -n "Checking: Stable finance deployment exists ... "
if kubectl get deployment finance-service-stable -n vextrus-production &>/dev/null; then
  echo -e "${GREEN}✓ PASS${NC}"
  PASSED=$((PASSED + 1))

  # Get stable version
  STABLE_IMAGE=$(kubectl get deployment finance-service-stable -n vextrus-production -o jsonpath='{.spec.template.spec.containers[0].image}')
  echo "  Current stable version: $STABLE_IMAGE"
else
  echo -e "${YELLOW}⚠ WARNING${NC} (No stable deployment found - this might be first deployment)"
  PASSED=$((PASSED + 1))
fi

echo

# Summary
echo "=================================="
echo "Pre-Deployment Verification Summary"
echo "=================================="
echo "Passed: $PASSED"
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed: $FAILED${NC}"
fi
echo "=================================="

if [ $FAILED -gt 0 ]; then
  echo -e "${RED}❌ DEPLOYMENT NOT READY${NC}"
  echo "Please fix the failed checks before proceeding."
  echo
  echo "Common fixes:"
  echo "1. Create namespaces: kubectl create namespace vextrus-staging && kubectl create namespace vextrus-production"
  echo "2. Create secrets: Follow k8s/DEPLOYMENT_GUIDE.md section 'Phase 2' and 'Phase 4'"
  echo "3. Verify cluster access: kubectl cluster-info"
  echo
  exit 1
else
  echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
  echo "Ready to proceed with deployment!"
  echo
  echo "Next steps:"
  echo "1. Review k8s/DEPLOYMENT_GUIDE.md"
  echo "2. Run: ./k8s/deploy-week1.sh"
  echo
  exit 0
fi
