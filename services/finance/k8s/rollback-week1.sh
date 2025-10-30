#!/bin/bash
# Week 1 Rollback Script
# Emergency rollback procedures for Week 1 canary deployment

set -e

PRODUCTION_NAMESPACE="vextrus-production"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}"
echo "╔════════════════════════════════════════╗"
echo "║  Emergency Rollback - Week 1 Canary   ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

echo "This will rollback the Week 1 canary deployment."
echo "All traffic will be routed to the stable version."
echo

# Show current status
echo "Current deployment status:"
kubectl get pods -n $PRODUCTION_NAMESPACE -l app=finance-service
echo

# Rollback options
echo "Select rollback option:"
echo "1. Scale down canary to 0 replicas (keeps deployment for investigation)"
echo "2. Delete canary deployment completely"
echo "3. Rollback canary to previous version"
echo "4. Cancel"
echo

read -p "Choose option (1-4): " OPTION

case $OPTION in
  1)
    echo -e "${YELLOW}Scaling down canary to 0 replicas...${NC}"
    kubectl scale deployment/finance-service-week1 -n $PRODUCTION_NAMESPACE --replicas=0
    echo -e "${GREEN}✓ Canary scaled down${NC}"
    ;;
  2)
    echo -e "${YELLOW}Deleting canary deployment...${NC}"
    kubectl delete deployment finance-service-week1 -n $PRODUCTION_NAMESPACE
    kubectl delete hpa finance-service-week1-hpa -n $PRODUCTION_NAMESPACE
    echo -e "${GREEN}✓ Canary deleted${NC}"
    ;;
  3)
    echo -e "${YELLOW}Rolling back canary to previous version...${NC}"
    kubectl rollout undo deployment/finance-service-week1 -n $PRODUCTION_NAMESPACE
    kubectl rollout status deployment/finance-service-week1 -n $PRODUCTION_NAMESPACE
    echo -e "${GREEN}✓ Canary rolled back${NC}"
    ;;
  4)
    echo "Rollback cancelled."
    exit 0
    ;;
  *)
    echo -e "${RED}Invalid option${NC}"
    exit 1
    ;;
esac

echo
echo "Verifying traffic routing to stable only..."
sleep 5
kubectl get pods -n $PRODUCTION_NAMESPACE -l app=finance-service

echo
echo -e "${GREEN}Rollback complete!${NC}"
echo
echo "Post-Rollback Actions:"
echo "1. Verify error rate returned to normal:"
echo "   ./k8s/04-smoke-tests.sh production"
echo
echo "2. Collect logs from failed canary:"
echo "   kubectl logs -n $PRODUCTION_NAMESPACE -l version=week1 --previous > week1-failure-logs.txt"
echo
echo "3. Check events:"
echo "   kubectl get events -n $PRODUCTION_NAMESPACE --sort-by='.lastTimestamp' | head -20"
echo
echo "4. Investigate root cause and plan remediation"
echo "5. Update team on rollback status"
echo
echo "Monitoring for 30 minutes recommended before declaring stable."
