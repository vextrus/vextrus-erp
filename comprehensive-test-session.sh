#!/bin/bash

# Comprehensive Finance Module Testing
# Phase 1: Create Test Data
# Phase 2: Verify CRUD Operations
# Phase 3: Security Testing

echo "======================================"
echo "Finance Module Comprehensive Testing"
echo "======================================"
echo ""

# Configuration
API_URL="http://localhost:4000/graphql"
JWT=""

# Step 1: Authenticate
echo "Step 1: Authenticating..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(input: {email: \"admin@vextrus.com\", password: \"admin123\"}) { accessToken user { id email } } }"
  }')

JWT=$(echo "$LOGIN_RESPONSE" | jq -r '.data.login.accessToken')

if [ -z "$JWT" ] || [ "$JWT" = "null" ]; then
  echo "❌ Authentication failed"
  echo "$LOGIN_RESPONSE" | jq .
  exit 1
fi

echo "✅ Authentication successful"
echo "JWT: ${JWT:0:50}..."
echo ""

# Step 2: Create Chart of Accounts
echo "======================================"
echo "PHASE 1: CREATE TEST DATA"
echo "======================================"
echo ""
echo "Step 2: Creating Chart of Accounts..."
echo ""

# Account 1: Cash at Bank
echo "Creating Account 1: Cash at Bank..."
ACCOUNT1_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "query": "mutation CreateAccount($input: CreateAccountInput!) { createAccount(input: $input) { id accountCode accountName accountType currency balance { amount currency } } }",
    "variables": {
      "input": {
        "accountCode": "1010",
        "accountName": "Cash at Bank",
        "accountType": "ASSET",
        "currency": "BDT"
      }
    }
  }')

echo "$ACCOUNT1_RESPONSE" | jq .
ACCOUNT1_ID=$(echo "$ACCOUNT1_RESPONSE" | jq -r '.data.createAccount.id')

if [ -z "$ACCOUNT1_ID" ] || [ "$ACCOUNT1_ID" = "null" ]; then
  echo "❌ Failed to create Account 1"
else
  echo "✅ Account 1 created: $ACCOUNT1_ID"
fi
echo ""

# Account 2: Accounts Receivable
echo "Creating Account 2: Accounts Receivable..."
ACCOUNT2_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "query": "mutation CreateAccount($input: CreateAccountInput!) { createAccount(input: $input) { id accountCode accountName accountType currency } }",
    "variables": {
      "input": {
        "accountCode": "1020",
        "accountName": "Accounts Receivable",
        "accountType": "ASSET",
        "currency": "BDT"
      }
    }
  }')

echo "$ACCOUNT2_RESPONSE" | jq .
ACCOUNT2_ID=$(echo "$ACCOUNT2_RESPONSE" | jq -r '.data.createAccount.id')

if [ -z "$ACCOUNT2_ID" ] || [ "$ACCOUNT2_ID" = "null" ]; then
  echo "❌ Failed to create Account 2"
else
  echo "✅ Account 2 created: $ACCOUNT2_ID"
fi
echo ""

# Account 3: Revenue
echo "Creating Account 3: Revenue..."
ACCOUNT3_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "query": "mutation CreateAccount($input: CreateAccountInput!) { createAccount(input: $input) { id accountCode accountName accountType currency } }",
    "variables": {
      "input": {
        "accountCode": "4000",
        "accountName": "Revenue",
        "accountType": "REVENUE",
        "currency": "BDT"
      }
    }
  }')

echo "$ACCOUNT3_RESPONSE" | jq .
ACCOUNT3_ID=$(echo "$ACCOUNT3_RESPONSE" | jq -r '.data.createAccount.id')

if [ -z "$ACCOUNT3_ID" ] || [ "$ACCOUNT3_ID" = "null" ]; then
  echo "❌ Failed to create Account 3"
else
  echo "✅ Account 3 created: $ACCOUNT3_ID"
fi
echo ""

echo "======================================"
echo "Summary: Chart of Accounts Creation"
echo "======================================"
echo "Account 1 (Cash at Bank):       $ACCOUNT1_ID"
echo "Account 2 (Accounts Receivable): $ACCOUNT2_ID"
echo "Account 3 (Revenue):            $ACCOUNT3_ID"
echo ""

# Save IDs for next phases
echo "$ACCOUNT1_ID" > /tmp/account1_id.txt
echo "$ACCOUNT2_ID" > /tmp/account2_id.txt
echo "$ACCOUNT3_ID" > /tmp/account3_id.txt

echo "Test data creation complete!"
echo "Proceed to Phase 2: Verify Read Operations"

