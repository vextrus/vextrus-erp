#!/bin/bash

echo "Testing GraphQL endpoints..."
echo "==============================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test Auth Service GraphQL
echo -e "\n${GREEN}Testing Auth Service GraphQL...${NC}"
curl -s -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}' | jq -r '.data.__schema.types[0:5] | .[].name' 2>/dev/null || echo -e "${RED}Auth service GraphQL not responding${NC}"

# Test Master Data Service GraphQL
echo -e "\n${GREEN}Testing Master Data Service GraphQL...${NC}"
curl -s -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}' | jq -r '.data.__schema.types[0:5] | .[].name' 2>/dev/null || echo -e "${RED}Master Data service GraphQL not responding${NC}"

# Test Workflow Service GraphQL
echo -e "\n${GREEN}Testing Workflow Service GraphQL...${NC}"
curl -s -X POST http://localhost:3011/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}' | jq -r '.data.__schema.types[0:5] | .[].name' 2>/dev/null || echo -e "${RED}Workflow service GraphQL not responding${NC}"

# Test Rules Engine Service GraphQL
echo -e "\n${GREEN}Testing Rules Engine Service GraphQL...${NC}"
curl -s -X POST http://localhost:3012/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}' | jq -r '.data.__schema.types[0:5] | .[].name' 2>/dev/null || echo -e "${RED}Rules Engine service GraphQL not responding${NC}"

# Test API Gateway Federation
echo -e "\n${GREEN}Testing API Gateway Federation...${NC}"
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}' | jq -r '.data.__schema.types[0:5] | .[].name' 2>/dev/null || echo -e "${RED}API Gateway not responding${NC}"

echo -e "\n==============================="
echo "Test complete!"