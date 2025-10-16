#!/bin/bash

# Health endpoint test script for all backend services
# Tests multiple path variations to discover actual health endpoint locations

echo "==================================================================="
echo "Backend Services Health Check Audit"
echo "==================================================================="
echo ""

# Service definitions: name:port
services=(
  "auth:3001"
  "master-data:3002"
  "notification:3003"
  "configuration:3004"
  "scheduler:3005"
  "document-generator:3006"
  "import-export:3007"
  "file-storage:3008"
  "audit:3009"
  "workflow:3011"
  "rules-engine:3012"
  "finance:3014"
  "organization:3016"
  "api-gateway:4000"
)

# Health endpoint path variations to test
paths=(
  "/health"
  "/api/v1/health"
  "/api/health"
  "/health/ready"
  "/api/v1/health/ready"
  "/health/live"
  "/api/v1/health/live"
)

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test each service
for service in "${services[@]}"; do
  IFS=':' read -r name port <<< "$service"
  echo "-------------------------------------------------------------------"
  echo "Service: $name (port $port)"
  echo "-------------------------------------------------------------------"

  found_endpoint=false

  for path in "${paths[@]}"; do
    url="http://localhost:${port}${path}"

    # Test endpoint with timeout
    response=$(curl -s -w "\n%{http_code}" --max-time 3 "$url" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" == "200" ]; then
      echo -e "${GREEN}✓ ${path} - HTTP 200${NC}"

      # Check if response is JSON
      if echo "$body" | jq . >/dev/null 2>&1; then
        status=$(echo "$body" | jq -r '.status // "unknown"')
        echo "  Status: $status"

        # Show component statuses if available
        if echo "$body" | jq -e '.details' >/dev/null 2>&1; then
          echo "  Components:"
          echo "$body" | jq -r '.details | to_entries[] | "    - \(.key): \(.value.status)"'
        elif echo "$body" | jq -e '.info' >/dev/null 2>&1; then
          echo "  Components:"
          echo "$body" | jq -r '.info | to_entries[] | "    - \(.key): \(.value.status)"'
        fi

        # Show errors if any
        if echo "$body" | jq -e '.error | length > 0' >/dev/null 2>&1; then
          echo -e "  ${YELLOW}Errors:${NC}"
          echo "$body" | jq -r '.error | to_entries[] | "    - \(.key): \(.value.message)"'
        fi
      else
        echo "  Response (non-JSON): ${body:0:100}"
      fi

      found_endpoint=true
      echo ""
      break
    elif [ "$http_code" == "404" ]; then
      echo -e "${RED}✗ ${path} - HTTP 404 (Not Found)${NC}"
    elif [ "$http_code" == "000" ]; then
      echo -e "${RED}✗ ${path} - Connection failed/timeout${NC}"
    else
      echo -e "${YELLOW}? ${path} - HTTP ${http_code}${NC}"
    fi
  done

  if [ "$found_endpoint" = false ]; then
    echo -e "${RED}❌ No working health endpoint found${NC}"
  fi

  echo ""
done

echo "==================================================================="
echo "Health Check Audit Complete"
echo "==================================================================="
