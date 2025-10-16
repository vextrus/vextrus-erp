# Insomnia Schema Refresh - Troubleshooting Guide

## Issue: "Refresh Schema" Does Nothing

### Quick Fix Checklist

#### 1. ✅ Verify Request Type
**CRITICAL**: Your request MUST be set to **GraphQL** type, not POST!

**How to check:**
- Look at the request name area
- You should see a dropdown that says `GraphQL`
- If it says `POST`, `GET`, or anything else, that's the problem!

**How to fix:**
1. Click the dropdown next to your request name
2. Select **GraphQL** from the list
3. Try "Refresh Schema" again

---

#### 2. ✅ Verify URL Format
**Correct**: `http://localhost:3002/graphql`
**Wrong**: `http://localhost:3002/graphql/` (trailing slash)
**Wrong**: Missing `/graphql` endpoint

---

#### 3. ✅ Check Headers Are Set
Required headers:
```
Content-Type: application/json
x-tenant-id: default
```

**Note**: For schema introspection, you usually DON'T need the Authorization header!

---

#### 4. ✅ Test Schema Manually First
Before clicking "Refresh Schema", test if introspection works:

**Type this query in the Body tab:**
```graphql
{
  __schema {
    queryType {
      name
    }
  }
}
```

**Click Send**

**Expected response:**
```json
{
  "data": {
    "__schema": {
      "queryType": {
        "name": "Query"
      }
    }
  }
}
```

If this works, schema introspection is functioning!

---

## Step-by-Step: Create GraphQL Request Correctly

### Method 1: Create New GraphQL Request

1. **Create new request**
   - Press `Ctrl+N` or click "+" button
   - Name: `Master Data GraphQL`

2. **IMPORTANT: Set request type to GraphQL**
   - Click dropdown next to request name
   - Select: **GraphQL** (NOT POST!)

3. **Set URL**
   - Enter: `http://localhost:3002/graphql`

4. **Add Headers**
   - Click "Header" tab
   - Add: `Content-Type` = `application/json`
   - Add: `x-tenant-id` = `default`

5. **Test Basic Query**
   - In Body/Query panel, type:
   ```graphql
   {
     __typename
   }
   ```
   - Click "Send"
   - Should see: `{"data":{"__typename":"Query"}}`

6. **Now Refresh Schema**
   - Look for "Schema" button/dropdown (usually top-right of query panel)
   - Click "Refresh Schema" or "Update Schema"
   - Wait 2-3 seconds
   - You should see autocomplete suggestions appear!

---

## Alternative: Manual Schema Testing

If "Refresh Schema" still doesn't work, you can still use GraphQL with manual queries:

### Working Queries You Can Try Right Now:

#### Query 1: List Available Queries
```graphql
{
  __schema {
    queryType {
      fields {
        name
        description
      }
    }
  }
}
```

#### Query 2: Get Customer Type Structure
```graphql
{
  __type(name: "Customer") {
    name
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}
```

#### Query 3: Get PaginatedCustomerResponse Structure
```graphql
{
  __type(name: "PaginatedCustomerResponse") {
    name
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}
```

#### Query 4: Validate TIN (with Auth)
```graphql
{
  validateTin(tin: "1234567890")
}
```
**Requires**: Authorization header with JWT token

---

## Common Insomnia Issues

### Issue: "Request type is POST, not GraphQL"
**Solution**: Change request type dropdown to **GraphQL**

### Issue: "Schema refresh does nothing"
**Possible causes:**
1. Request type not set to GraphQL
2. Server doesn't support introspection (but we verified it does)
3. Insomnia needs to be restarted
4. Try removing and re-adding the request

### Issue: "GraphQL tab doesn't show autocomplete"
**This is normal if:**
- Schema refresh hasn't been done yet
- You can still write queries manually
- Autocomplete is a bonus, not required

---

## Working Without Schema Refresh

You don't actually NEED schema refresh to work! Here's what you can do:

### Use These Pre-Written Queries:

#### Get Customers (Paginated)
```graphql
query GetCustomers {
  customers(limit: 10, page: 1) {
    data {
      id
      name
      email
      phone
      tin
    }
    total
    page
    totalPages
  }
}
```

#### Get Vendors
```graphql
query GetVendors {
  vendors(limit: 10) {
    data {
      id
      name
      email
      vendorType
    }
    total
  }
}
```

#### Validate TIN
```graphql
query ValidateTIN {
  validateTin(tin: "1234567890")
}
```

#### Validate NID
```graphql
query ValidateNID {
  validateNid(nid: "1234567890123")
}
```

---

## Verify Everything is Working

Run this complete test in Insomnia:

### Test 1: Health Check
```graphql
{
  __typename
}
```
**Expected**: `{"data":{"__typename":"Query"}}`

### Test 2: Schema Check
```graphql
{
  __schema {
    queryType {
      name
    }
  }
}
```
**Expected**: `{"data":{"__schema":{"queryType":{"name":"Query"}}}}`

### Test 3: Authentication (with token)
```graphql
{
  validateTin(tin: "1234567890")
}
```
**Expected**: `{"data":{"validateTin":true}}`

---

## Still Not Working?

### Check Insomnia Version
- Insomnia 2023.x or newer recommended
- GraphQL support improved in recent versions
- Consider updating Insomnia

### Check Insomnia Settings
1. Go to Preferences (Ctrl+,)
2. Check "Enable GraphQL Introspection" is ON
3. Check network settings aren't blocking localhost

### Alternative GraphQL Clients
If Insomnia schema refresh continues to fail:
- **Altair GraphQL Client** - Very reliable schema introspection
- **Postman** - Also supports GraphQL with introspection
- **GraphQL Playground Desktop** - Dedicated GraphQL IDE

---

## Quick Commands Reference

### Generate New Token (when expired)
```bash
node generate-jwt-token.js
```

### Test GraphQL via CLI
```bash
bash test-master-data-graphql.sh
```

### Manual curl Test
```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default" \
  -d '{"query":"{ __typename }"}'
```

---

## Summary

✅ **GraphQL endpoint is working**
✅ **Introspection is enabled**
✅ **Schema is available**

If "Refresh Schema" doesn't work in Insomnia:
1. Verify request type is **GraphQL**
2. Use manual queries (they work fine!)
3. Consider trying Altair GraphQL Client

**You can still test everything without schema refresh working!**
