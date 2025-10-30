#!/bin/bash

# Quick script to restart Finance service after code changes

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}Restarting Finance Service...${NC}"
echo ""

# Stop finance service
echo -e "${YELLOW}[1/4] Stopping finance service...${NC}"
docker-compose stop finance

# Rebuild with no cache to ensure new code is used
echo -e "${YELLOW}[2/4] Rebuilding finance service (this may take 1-2 minutes)...${NC}"
docker-compose build --no-cache finance

# Start finance service
echo -e "${YELLOW}[3/4] Starting finance service...${NC}"
docker-compose up -d finance

# Wait for service to be ready
echo -e "${YELLOW}[4/4] Waiting for service to be ready (15 seconds)...${NC}"
sleep 15

echo ""
echo -e "${YELLOW}Checking service health...${NC}"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3014/health 2>/dev/null)

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Finance service is healthy and running!${NC}"
    echo ""
    echo -e "${CYAN}Apollo Sandbox: http://localhost:3014/graphql${NC}"
    echo -e "${GREEN}Schema should now load automatically!${NC}"
else
    echo -e "${YELLOW}! Service may still be starting...${NC}"
    echo -e "${GRAY}  Wait a few more seconds and try: http://localhost:3014/health${NC}"
fi

echo ""
echo -e "${GRAY}View logs: docker-compose logs -f finance${NC}"
echo ""
