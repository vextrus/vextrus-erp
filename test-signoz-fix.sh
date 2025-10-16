#!/bin/bash

# SignOz Fix Verification Script
# Tests all SignOz services after fixes applied

echo "======================================"
echo "SignOz Fix Verification Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check container status
echo "Test 1: Checking container status..."
if docker ps --filter "name=vextrus-signoz" --format "table {{.Names}}\t{{.Status}}" | grep -q "Up"; then
    echo -e "${GREEN}✓ SignOz containers are running${NC}"
    docker ps --filter "name=vextrus-signoz" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${RED}✗ SignOz containers are not running${NC}"
    exit 1
fi
echo ""

# Test 2: Check Query Service health
echo "Test 2: Checking Query Service health..."
if docker inspect vextrus-signoz-query-service --format='{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; then
    echo -e "${GREEN}✓ Query Service is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Query Service not yet healthy (may still be starting up)${NC}"
fi
echo ""

# Test 3: Check for SQLite errors
echo "Test 3: Checking for SQLite database errors..."
if docker logs vextrus-signoz-query-service 2>&1 | grep -q "unable to open database file"; then
    echo -e "${RED}✗ SQLite database error detected${NC}"
    docker logs vextrus-signoz-query-service --tail 10
    exit 1
else
    echo -e "${GREEN}✓ No SQLite database errors${NC}"
fi
echo ""

# Test 4: Check for authentication errors
echo "Test 4: Checking for ClickHouse authentication errors..."
if docker logs vextrus-signoz-query-service 2>&1 | grep -qi "authentication failed"; then
    echo -e "${RED}✗ Authentication errors detected${NC}"
    docker logs vextrus-signoz-query-service 2>&1 | grep -i "authentication" | tail -5
    exit 1
else
    echo -e "${GREEN}✓ No authentication errors${NC}"
fi
echo ""

# Test 5: Check Frontend nginx errors
echo "Test 5: Checking Frontend for nginx errors..."
if docker logs vextrus-signoz-frontend 2>&1 | grep -q "host not found in upstream"; then
    echo -e "${RED}✗ Frontend host resolution error detected${NC}"
    docker logs vextrus-signoz-frontend --tail 10
    exit 1
else
    echo -e "${GREEN}✓ No nginx host resolution errors${NC}"
fi
echo ""

# Test 6: Check Query Service API
echo "Test 6: Testing Query Service API endpoint..."
if curl -sf http://localhost:8084/api/v1/version > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Query Service API is responding${NC}"
    echo "Version info:"
    curl -s http://localhost:8084/api/v1/version | head -5
else
    echo -e "${YELLOW}⚠ Query Service API not responding (may still be starting)${NC}"
fi
echo ""

# Test 7: Check volume exists
echo "Test 7: Checking SignOz volume..."
if docker volume ls | grep -q "signoz_query_data"; then
    echo -e "${GREEN}✓ signoz_query_data volume exists${NC}"
else
    echo -e "${RED}✗ signoz_query_data volume missing${NC}"
    exit 1
fi
echo ""

# Test 8: Check port allocation
echo "Test 8: Verifying port 8084 is used (not 8081)..."
if docker ps --filter "name=vextrus-signoz-query-service" --format "{{.Ports}}" | grep -q "8084"; then
    echo -e "${GREEN}✓ Query Service using port 8084 (correct)${NC}"
else
    echo -e "${RED}✗ Query Service not using port 8084${NC}"
    exit 1
fi
echo ""

# Final summary
echo "======================================"
echo "Verification Complete!"
echo "======================================"
echo ""
echo "If all tests passed, your SignOz services are working correctly."
echo ""
echo "Next steps:"
echo "1. Access SignOz UI at http://localhost:3301"
echo "2. Configure OTEL exporters in your microservices"
echo "3. Set up alerts and dashboards"
echo ""
