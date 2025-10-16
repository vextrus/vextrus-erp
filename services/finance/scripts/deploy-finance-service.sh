#!/bin/bash
# Finance Service Deployment Script
# Complete deployment workflow with health checks

set -e

echo "=== Finance Service Deployment ==="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ENVIRONMENT=${1:-"development"}

echo -e "${YELLOW}Deploying to: $ENVIRONMENT${NC}"
echo ""

# Step 1: Verify infrastructure
echo -e "${YELLOW}[1/6] Verifying infrastructure...${NC}"
bash scripts/verify-infrastructure.sh
echo ""

# Step 2: Build the service
echo -e "${YELLOW}[2/6] Building service...${NC}"
npm run build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 3: Run database migrations
echo -e "${YELLOW}[3/6] Running database migrations...${NC}"
bash scripts/run-migrations.sh run
echo ""

# Step 4: Run tests
echo -e "${YELLOW}[4/6] Running tests...${NC}"
npm run test:unit
echo -e "${GREEN}✓ Tests passed${NC}"
echo ""

# Step 5: Start the service
echo -e "${YELLOW}[5/6] Starting service...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    pm2 start dist/main.js --name finance-service
else
    npm run start:dev &
    SERVICE_PID=$!
    sleep 5
fi
echo -e "${GREEN}✓ Service started${NC}"
echo ""

# Step 6: Health check
echo -e "${YELLOW}[6/6] Running health checks...${NC}"
sleep 3

# Check health endpoint
if curl -sf http://localhost:3006/health/live > /dev/null; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    if [ -n "$SERVICE_PID" ]; then
        kill $SERVICE_PID
    fi
    exit 1
fi

# Check GraphQL endpoint
if curl -sf http://localhost:3006/graphql > /dev/null; then
    echo -e "${GREEN}✓ GraphQL endpoint available${NC}"
else
    echo -e "${YELLOW}⚠ GraphQL endpoint not responding${NC}"
fi

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Service Information:"
echo "  Environment: $ENVIRONMENT"
echo "  Port: 3006"
echo "  Health: http://localhost:3006/health"
echo "  GraphQL: http://localhost:3006/graphql"
echo "  Apollo Sandbox: http://localhost:3006/graphql"
echo ""
