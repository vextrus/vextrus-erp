#!/bin/bash

# Infrastructure Validation Script
# Date: 2025-09-13
# Purpose: Validate all infrastructure components and services are running

echo "========================================="
echo "Vextrus ERP Infrastructure Validation"
echo "========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    printf "Checking %-20s : " "$name"
    
    if status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null); then
        if [ "$status" = "$expected_status" ]; then
            echo -e "${GREEN}✓ Running${NC} (HTTP $status)"
            return 0
        else
            echo -e "${YELLOW}⚠ Unhealthy${NC} (HTTP $status)"
            return 1
        fi
    else
        echo -e "${RED}✗ Not responding${NC}"
        return 1
    fi
}

# Function to check Docker container
check_container() {
    local name=$1
    printf "Checking %-20s : " "$name"
    
    if docker ps --format '{{.Names}}' | grep -q "^$name$"; then
        status=$(docker inspect -f '{{.State.Health.Status}}' "$name" 2>/dev/null || echo "running")
        if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
            echo -e "${GREEN}✓ Running${NC} ($status)"
            return 0
        else
            echo -e "${YELLOW}⚠ Unhealthy${NC} ($status)"
            return 1
        fi
    else
        echo -e "${RED}✗ Not running${NC}"
        return 1
    fi
}

# Function to check port
check_port() {
    local name=$1
    local port=$2
    printf "Checking %-20s : " "$name (port $port)"
    
    if netstat -an 2>/dev/null | grep -q ":$port.*LISTEN" || ss -tuln 2>/dev/null | grep -q ":$port"; then
        echo -e "${GREEN}✓ Port open${NC}"
        return 0
    else
        echo -e "${RED}✗ Port closed${NC}"
        return 1
    fi
}

echo "1. Infrastructure Components"
echo "----------------------------"
check_container "vextrus-postgres"
check_container "vextrus-redis"
check_container "vextrus-kafka"
check_container "vextrus-zookeeper"
check_container "vextrus-temporal"
check_container "vextrus-temporal-ui"
check_container "vextrus-minio"
echo ""

echo "2. Infrastructure Ports"
echo "-----------------------"
check_port "PostgreSQL" 5432
check_port "Redis" 6379
check_port "Kafka" 9092
check_port "Temporal" 7233
check_port "Temporal UI" 8088
check_port "MinIO" 9000
echo ""

echo "3. Services"
echo "-----------"
check_service "Auth Service" "http://localhost:3001/api/v1/health"
check_service "Master Data" "http://localhost:3002/health"
check_service "Workflow Service" "http://localhost:3010/health"
check_service "Rules Engine" "http://localhost:3012/health"
check_service "API Gateway" "http://localhost:3000/health"
echo ""

echo "4. Admin Tools"
echo "--------------"
check_service "Adminer (DB)" "http://localhost:8082" 200
check_service "Redis Commander" "http://localhost:8083" 200
check_service "Kafka UI" "http://localhost:8085" 200
check_service "MinIO Console" "http://localhost:9001" 200
echo ""

echo "5. Temporal Verification"
echo "------------------------"
printf "Checking %-20s : " "Temporal Health"
if curl -s http://localhost:7233/health 2>/dev/null | grep -q "SERVING"; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Not healthy${NC}"
fi

printf "Checking %-20s : " "Temporal UI"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8088 2>/dev/null | grep -q "200"; then
    echo -e "${GREEN}✓ Accessible${NC}"
else
    echo -e "${RED}✗ Not accessible${NC}"
fi
echo ""

echo "========================================="
echo "Validation Complete"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. Start any services that are not running"
echo "2. Check logs for failed services: docker logs <container-name>"
echo "3. Review .env files for configuration issues"
echo "4. Ensure all required ports are available"
echo ""