#!/bin/bash
# Comprehensive Apollo Sandbox Test Suite for All Services

echo "==========================================="
echo "Apollo Sandbox Migration Test Suite"
echo "==========================================="
echo ""

# Service configuration: service_name:port
SERVICES=(
  "auth:3001"
  "master-data:3002"
  "finance:3003"
  "organization:3004"
  "configuration:3005"
  "rules-engine:3006"
  "workflow:3007"
  "scheduler:3008"
  "notification:3009"
  "audit:3009"
  "import-export:3011"
  "file-storage:3012"
  "document-generator:3006"
  "api-gateway:4000"
)

passed=0
failed=0
failed_services=()

for entry in "${SERVICES[@]}"; do
  IFS=':' read -r service port <<< "$entry"
  echo "Testing: $service (http://localhost:$port/graphql)"
  echo "----------------------------------------"

  # Test 1: GraphQL Health Check
  echo -n "  1. GraphQL POST (__typename query)... "
  response=$(curl -s -X POST http://localhost:$port/graphql \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __typename }"}' 2>&1)

  if echo "$response" | grep -q '"__typename"'; then
    echo "PASS"
    post_pass=1
  else
    echo "FAIL"
    echo "     Response: $response"
    post_pass=0
  fi

  # Test 2: Apollo Sandbox Landing Page
  echo -n "  2. Apollo Sandbox HTML page... "
  html=$(curl -s http://localhost:$port/graphql -H "Accept: text/html" 2>&1)
  if echo "$html" | grep -q "<!DOCTYPE html>"; then
    echo "PASS"
    sandbox_pass=1
  else
    echo "FAIL"
    sandbox_pass=0
  fi

  # Test 3: Schema Introspection
  echo -n "  3. Schema introspection... "
  introspection=$(curl -s -X POST http://localhost:$port/graphql \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __schema { queryType { name } } }"}' 2>&1)

  if echo "$introspection" | grep -q '"queryType"'; then
    echo "PASS"
    introspection_pass=1
  else
    echo "FAIL"
    introspection_pass=0
  fi

  # Calculate result for this service
  if [ $post_pass -eq 1 ] && [ $sandbox_pass -eq 1 ] && [ $introspection_pass -eq 1 ]; then
    echo "  Result: ALL TESTS PASSED"
    ((passed++))
  else
    echo "  Result: SOME TESTS FAILED"
    ((failed++))
    failed_services+=("$service")
  fi

  echo ""
done

# Summary
echo "==========================================="
echo "Test Summary"
echo "==========================================="
echo "Total Services: $((passed + failed))"
echo "Passed: $passed"
echo "Failed: $failed"

if [ $failed -gt 0 ]; then
  echo ""
  echo "Failed Services:"
  for svc in "${failed_services[@]}"; do
    echo "  - $svc"
  done
  echo ""
  echo "Status: INCOMPLETE"
  exit 1
else
  echo ""
  echo "Status: ALL SERVICES MIGRATED SUCCESSFULLY!"
  exit 0
fi
