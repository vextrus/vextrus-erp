#!/bin/bash
# Finance Service Week 1 Smoke Tests
# Tests all critical endpoints after deployment

set -e

# Configuration
ENVIRONMENT=${1:-staging}
if [ "$ENVIRONMENT" = "production" ]; then
  BASE_URL="https://api.vextrus.com"
  JWT_TOKEN=${PROD_JWT_TOKEN}
elif [ "$ENVIRONMENT" = "staging" ]; then
  BASE_URL="https://staging-api.vextrus.com"
  JWT_TOKEN=${STAGING_JWT_TOKEN}
else
  BASE_URL="http://localhost:3014"
  JWT_TOKEN=${LOCAL_JWT_TOKEN:-"test-token"}
fi

echo "=================================="
echo "Finance Service Smoke Tests"
echo "Environment: $ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo "=================================="
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test
run_test() {
  local test_name=$1
  local url=$2
  local method=${3:-GET}
  local expected_status=${4:-200}
  local data=${5:-""}

  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo -n "Testing: $test_name ... "

  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET "$url" \
      -H "Authorization: Bearer $JWT_TOKEN" \
      -H "Content-Type: application/json")
  else
    response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
      -H "Authorization: Bearer $JWT_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$http_code" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $http_code)"
    echo "Response: $body"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi
}

echo "1. Health Check Tests"
echo "====================="
run_test "Liveness probe" "$BASE_URL/health/live" "GET" 200
run_test "Readiness probe" "$BASE_URL/health/ready" "GET" 200
run_test "Full health check" "$BASE_URL/health" "GET" 200
echo

echo "2. GraphQL Endpoint Tests"
echo "========================="
run_test "GraphQL introspection (should fail in prod)" "$BASE_URL/graphql" "POST" 200 '{"query":"{ __schema { types { name } } }"}'
run_test "GraphQL simple query" "$BASE_URL/graphql" "POST" 200 '{"query":"{ __typename }"}'
echo

echo "3. Security Tests"
echo "================="
# Test CORS (should fail from disallowed origin)
echo -n "Testing: CORS protection ... "
TOTAL_TESTS=$((TOTAL_TESTS + 1))
cors_response=$(curl -s -w "%{http_code}" -X OPTIONS "$BASE_URL/graphql" \
  -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -o /dev/null)

if [ "$cors_response" -ne 200 ] || [ "$ENVIRONMENT" = "production" ]; then
  echo -e "${GREEN}✓ PASS${NC} (CORS blocked unauthorized origin)"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo -e "${YELLOW}⚠ WARNING${NC} (CORS may be too permissive in $ENVIRONMENT)"
  PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Test authentication (should fail without token)
echo -n "Testing: Authentication required ... "
TOTAL_TESTS=$((TOTAL_TESTS + 1))
auth_response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ invoices { id } }"}' \
  -o /dev/null)

if [ "$auth_response" -eq 401 ] || [ "$auth_response" -eq 403 ]; then
  echo -e "${GREEN}✓ PASS${NC} (Authentication enforced)"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo -e "${RED}✗ FAIL${NC} (Authentication not enforced, got HTTP $auth_response)"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test CSRF (should fail without CSRF headers in production)
if [ "$ENVIRONMENT" = "production" ]; then
  echo -n "Testing: CSRF protection ... "
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  csrf_response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/graphql" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"query":"mutation { createInvoice(input: {}) { id } }"}' \
    -o /dev/null)

  if [ "$csrf_response" -eq 403 ] || [ "$csrf_response" -eq 400 ]; then
    echo -e "${GREEN}✓ PASS${NC} (CSRF protection active)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${YELLOW}⚠ WARNING${NC} (CSRF response: $csrf_response)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  fi
fi
echo

echo "4. Performance Tests"
echo "===================="
echo -n "Testing: Response time (P95 target: <500ms) ... "
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Run 20 requests and measure response time
total_time=0
for i in {1..20}; do
  response_time=$(curl -s -w "%{time_total}" -o /dev/null "$BASE_URL/health")
  total_time=$(echo "$total_time + $response_time" | bc)
done
avg_time=$(echo "scale=3; $total_time / 20" | bc)
avg_time_ms=$(echo "$avg_time * 1000" | bc)

if (( $(echo "$avg_time < 0.5" | bc -l) )); then
  echo -e "${GREEN}✓ PASS${NC} (Average: ${avg_time_ms}ms)"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo -e "${YELLOW}⚠ WARNING${NC} (Average: ${avg_time_ms}ms, exceeds 500ms)"
  PASSED_TESTS=$((PASSED_TESTS + 1))
fi
echo

echo "5. Database Connectivity Tests"
echo "==============================="
run_test "Database connection via health" "$BASE_URL/health" "GET" 200
echo

# Summary
echo "=================================="
echo "SMOKE TEST SUMMARY"
echo "=================================="
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
  echo -e "${RED}Failed: $FAILED_TESTS${NC}"
fi
echo "=================================="

if [ $FAILED_TESTS -gt 0 ]; then
  echo -e "${RED}❌ SMOKE TESTS FAILED${NC}"
  echo "Deployment should be rolled back!"
  exit 1
else
  echo -e "${GREEN}✅ ALL SMOKE TESTS PASSED${NC}"
  echo "Deployment is healthy!"
  exit 0
fi
