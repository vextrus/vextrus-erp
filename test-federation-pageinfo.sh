#!/bin/bash
# Test Federation with PageInfo Fix
# Tests that PageInfo is now shareable across all services

echo "Testing Federation PageInfo Fix..."
echo "=================================="
echo ""

echo "1. Testing API Gateway Health:"
curl -s http://localhost:4000/health | python -m json.tool
echo -e "\n"

echo "2. Testing PageInfo Type in Federated Schema:"
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __type(name: \"PageInfo\") { name fields { name type { name kind } } } }"}' | python -m json.tool
echo -e "\n"

echo "3. Testing Service-Specific Types:"
echo "   - Audit Service:"
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __type(name: \"AuditLogConnection\") { name fields { name } } }"}' | python -m json.tool
echo ""

echo "   - Configuration Service:"
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __type(name: \"ConfigurationConnection\") { name fields { name } } }"}' | python -m json.tool
echo ""

echo "   - Notification Service:"
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __type(name: \"NotificationConnection\") { name fields { name } } }"}' | python -m json.tool
echo ""

echo "   - Import-Export Service:"
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __type(name: \"ImportJobConnection\") { name fields { name } } }"}' | python -m json.tool
echo ""

echo "4. Testing Individual Service Sandboxes:"
echo "   - Audit (3010):"
curl -s http://localhost:3010/graphql -H "Accept: text/html" | grep -o "<title>.*</title>"
echo "   - Configuration (3005):"
curl -s http://localhost:3005/graphql -H "Accept: text/html" | grep -o "<title>.*</title>"
echo "   - Notification (3009):"
curl -s http://localhost:3009/graphql -H "Accept: text/html" | grep -o "<title>.*</title>"
echo "   - Import-Export (3011):"
curl -s http://localhost:3011/graphql -H "Accept: text/html" | grep -o "<title>.*</title>"
echo ""

echo "✅ Federation PageInfo Fix Test Complete!"
