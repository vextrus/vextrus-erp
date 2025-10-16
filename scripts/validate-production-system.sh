#!/bin/bash
set -e

echo "Validating complete production system..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Summary counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
ERRORS=""

# Function to check service health
check_health() {
    local service=$1
    local port=$2
    local endpoint="health"
    
    ((TOTAL_CHECKS++))
    echo -n "  Checking $service health endpoint... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/$endpoint 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓${NC}"
        ((PASSED_CHECKS++))
        return 0
    else
        echo -e "${RED}✗${NC} (HTTP $response)"
        ((FAILED_CHECKS++))
        ERRORS="$ERRORS\n  - $service health check failed (port $port)"
        return 1
    fi
}

# Function to check metrics endpoint
check_metrics() {
    local service=$1
    local port=$2
    
    ((TOTAL_CHECKS++))
    echo -n "  Checking $service metrics endpoint... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/metrics 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓${NC}"
        ((PASSED_CHECKS++))
        return 0
    else
        echo -e "${RED}✗${NC} (HTTP $response)"
        ((FAILED_CHECKS++))
        ERRORS="$ERRORS\n  - $service metrics endpoint failed (port $port)"
        return 1
    fi
}

# Function to check GraphQL endpoint
check_graphql() {
    local service=$1
    local port=$2
    
    ((TOTAL_CHECKS++))
    echo -n "  Checking $service GraphQL endpoint... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/graphql 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ] || [ "$response" = "400" ]; then
        echo -e "${GREEN}✓${NC}"
        ((PASSED_CHECKS++))
        return 0
    else
        echo -e "${RED}✗${NC} (HTTP $response)"
        ((FAILED_CHECKS++))
        ERRORS="$ERRORS\n  - $service GraphQL endpoint failed (port $port)"
        return 1
    fi
}

echo -e "\n${BLUE}=== Phase 1: Infrastructure Services ===${NC}"
echo "Checking 7 infrastructure services..."

# Infrastructure services
check_health "audit" 3001
check_metrics "audit" 3001
check_health "notification" 3002
check_metrics "notification" 3002
check_health "file-storage" 3003
check_metrics "file-storage" 3003
check_health "document-generator" 3004
check_metrics "document-generator" 3004
check_health "scheduler" 3005
check_metrics "scheduler" 3005
check_health "configuration" 3006
check_metrics "configuration" 3006
check_health "import-export" 3007
check_metrics "import-export" 3007

echo -e "\n${BLUE}=== Phase 2: Core Business Services ===${NC}"
echo "Checking 5 core business services..."

# Core services
check_health "auth" 3008
check_metrics "auth" 3008
check_graphql "auth" 3008

check_health "master-data" 3009
check_metrics "master-data" 3009
check_graphql "master-data" 3009

check_health "workflow" 3010
check_metrics "workflow" 3010
check_graphql "workflow" 3010

check_health "rules-engine" 3011
check_metrics "rules-engine" 3011
check_graphql "rules-engine" 3011

check_health "api-gateway" 3000
check_metrics "api-gateway" 3000
check_graphql "api-gateway" 3000

echo -e "\n${BLUE}=== Phase 3: Supporting Infrastructure ===${NC}"
echo "Checking supporting services..."

# Database
((TOTAL_CHECKS++))
echo -n "  Checking PostgreSQL... "
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED_CHECKS++))
    ERRORS="$ERRORS\n  - PostgreSQL is not running"
fi

# Redis
((TOTAL_CHECKS++))
echo -n "  Checking Redis... "
if redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED_CHECKS++))
    ERRORS="$ERRORS\n  - Redis is not running"
fi

# Kafka
((TOTAL_CHECKS++))
echo -n "  Checking Kafka... "
if timeout 2 bash -c 'cat < /dev/null > /dev/tcp/localhost/9092' 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED_CHECKS++))
    ERRORS="$ERRORS\n  - Kafka is not running"
fi

# Elasticsearch
((TOTAL_CHECKS++))
echo -n "  Checking Elasticsearch... "
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9200 2>/dev/null || echo "000")
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED_CHECKS++))
    ERRORS="$ERRORS\n  - Elasticsearch is not running"
fi

# Prometheus
((TOTAL_CHECKS++))
echo -n "  Checking Prometheus... "
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9090/-/ready 2>/dev/null || echo "000")
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED_CHECKS++))
    ERRORS="$ERRORS\n  - Prometheus is not running"
fi

# Grafana
((TOTAL_CHECKS++))
echo -n "  Checking Grafana... "
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/api/health 2>/dev/null || echo "000")
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED_CHECKS++))
    ERRORS="$ERRORS\n  - Grafana is not running"
fi

# Summary
echo -e "\n${BLUE}=== Validation Summary ===${NC}"
echo -e "Total checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "\n${GREEN}✓ All production infrastructure checks passed!${NC}"
    echo -e "\n${GREEN}The system is production-ready!${NC}"
    exit 0
else
    echo -e "\n${RED}Validation failed with $FAILED_CHECKS errors:${NC}"
    echo -e "$ERRORS"
    echo -e "\n${YELLOW}Troubleshooting steps:${NC}"
    echo "1. Check if all services are running: docker-compose ps"
    echo "2. Check service logs: docker-compose logs [service-name]"
    echo "3. Verify port bindings: docker-compose port [service-name] [port]"
    echo "4. Check database migrations: npm run migration:status"
    echo "5. Verify environment variables in .env file"
    exit 1
fi