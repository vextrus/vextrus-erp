#!/bin/bash
# Finance Service Infrastructure Verification Script
# Verifies all dependencies are running before starting the service

set -e

echo "=== Finance Service Infrastructure Verification ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if pg_isready -h ${DATABASE_HOST:-localhost} -p ${DATABASE_PORT:-5432} -U ${DATABASE_USERNAME:-vextrus} > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not available${NC}"
    FAILED=1
fi

# Check if finance database exists
echo -n "Checking database 'vextrus_finance'... "
if PGPASSWORD=${DATABASE_PASSWORD:-vextrus_dev_2024} psql -h ${DATABASE_HOST:-localhost} -p ${DATABASE_PORT:-5432} -U ${DATABASE_USERNAME:-vextrus} -lqt | cut -d \| -f 1 | grep -qw vextrus_finance; then
    echo -e "${GREEN}✓ Exists${NC}"
else
    echo -e "${YELLOW}⚠ Creating database...${NC}"
    PGPASSWORD=${DATABASE_PASSWORD:-vextrus_dev_2024} createdb -h ${DATABASE_HOST:-localhost} -p ${DATABASE_PORT:-5432} -U ${DATABASE_USERNAME:-vextrus} vextrus_finance
    echo -e "${GREEN}✓ Database created${NC}"
fi

# Check EventStore
echo -n "Checking EventStore... "
if curl -s -f http://${EVENTSTORE_HOST:-localhost}:2113/health/live > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not available${NC}"
    echo -e "${YELLOW}  Start EventStore: docker run -d -p 2113:2113 eventstore/eventstore:latest --insecure${NC}"
    FAILED=1
fi

# Check Kafka
echo -n "Checking Kafka... "
if nc -z ${KAFKA_HOST:-localhost} ${KAFKA_PORT:-9092} 2>/dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${YELLOW}⚠ Not available (optional for local dev)${NC}"
fi

# Check Node.js version
echo -n "Checking Node.js version... "
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -ge 20 ]; then
    echo -e "${GREEN}✓ $(node -v)${NC}"
else
    echo -e "${RED}✗ Node.js 20+ required, found $(node -v)${NC}"
    FAILED=1
fi

# Check dependencies installed
echo -n "Checking node_modules... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${YELLOW}⚠ Running npm install...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
fi

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}=== All infrastructure checks passed ===${NC}"
    exit 0
else
    echo -e "${RED}=== Infrastructure verification failed ===${NC}"
    echo -e "${YELLOW}Fix the errors above and try again${NC}"
    exit 1
fi
