# Apollo Sandbox Solution - RESOLVED ✅

## Problem Summary
Apollo Sandbox was showing "Unable to reach server" and "Introspection is disabled" errors, even though the GraphQL endpoint was working correctly via curl.

## Root Cause
**Manually adding `Content-Type: application/json` in Apollo Sandbox Headers** was causing conflicts.

Apollo Sandbox automatically sends the correct Content-Type header with GraphQL requests. Manually adding it caused duplicate or conflicting headers that resulted in 400 Bad Request errors.

## Solution

### ✅ Correct Header Configuration
In Apollo Sandbox, only include authentication and tenant headers:

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "X-Tenant-ID": "default"
}
```

**DO NOT include:**
```json
{
  "Content-Type": "application/json"  ❌ Don't add this!
}
```

### Why This Works
- Apollo Sandbox automatically handles `Content-Type: application/json` for POST requests
- Manually adding it causes header conflicts or duplication
- The GraphQL server (Apollo Server/NestJS) expects a single, properly formatted Content-Type header

---

## Quick Start Guide

### 1. Access Apollo Sandbox
Open in your browser:
```
http://localhost:3014/graphql
```

### 2. Configure Headers (for authenticated queries)
Click the "Headers" tab at the bottom and add:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "X-Tenant-ID": "default"
}
```

**Important:** Only add these two headers. Do NOT add Content-Type.

### 3. Explore the Schema
- The schema should load automatically in the left panel
- You'll see:
  - **Queries**: `invoice`, `invoices`
  - **Mutations**: `createInvoice`, `approveInvoice`, `cancelInvoice`
  - **Types**: `Invoice`, `MoneyDto`, `LineItem`, etc.

### 4. Run Queries

#### Example: Get Invoices (Requires Auth)
```graphql
query GetInvoices {
  invoices {
    id
    invoiceNumber
    status
    grandTotal
    invoiceDate
    dueDate
  }
}
```

#### Example: Get Single Invoice (Requires Auth)
```graphql
query GetInvoice($id: ID!) {
  invoice(id: $id) {
    id
    invoiceNumber
    customerId
    vendorId
    lineItems {
      description
      quantity
      unitPrice {
        amount
        currency
      }
    }
    grandTotal
    vatAmount
    status
  }
}
```

Variables:
```json
{
  "id": "your-invoice-id"
}
```

#### Example: Create Invoice (Requires Auth)
```graphql
mutation CreateInvoice($input: CreateInvoiceInput!) {
  createInvoice(input: $input) {
    id
    invoiceNumber
    status
    grandTotal
  }
}
```

Variables:
```json
{
  "input": {
    "customerId": "customer-uuid",
    "vendorId": "vendor-uuid",
    "invoiceDate": "2025-10-15",
    "dueDate": "2025-11-15",
    "lineItems": [
      {
        "description": "Construction Materials",
        "quantity": 10,
        "unitPrice": 5000,
        "currency": "BDT",
        "vatCategory": "STANDARD"
      }
    ],
    "vendorTIN": "1234567890",
    "vendorBIN": "123456789",
    "customerTIN": "0987654321",
    "customerBIN": "098765432"
  }
}
```

---

## Troubleshooting

### Schema Not Loading
1. **Hard refresh the page**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Check browser console** for actual errors (not just Apollo's noise)
3. **Verify service is running**: `docker ps | grep finance`
4. **Test with curl**:
   ```bash
   curl -X POST http://localhost:3014/graphql \
     -H "Content-Type: application/json" \
     -d '{"query":"{ __schema { queryType { name } } }"}'
   ```

### Authentication Errors
**Error: "No token provided"**
- Add Authorization header: `Bearer YOUR_JWT_TOKEN`
- Generate JWT token using the authentication service

**Error: "Invalid token"**
- Token might be expired
- Verify token format (should start with `eyJ`)
- Check authentication service is running

### CORS Errors
If you see CORS errors in browser console:
- Service has CORS enabled for all origins (`*`)
- Restart the service: `docker-compose restart finance`

---

## What Was Fixed

### Backend Changes
1. ✅ **TypeScript Compilation Errors** (6 errors fixed)
   - Fixed `CurrentUserContext` interface
   - Fixed Invoice entity nullable fields
   - Fixed EventStore repository logger
   - Fixed enum usage in event handlers
   - Fixed Money value object conversion

2. ✅ **Dependency Injection**
   - Created `AuthModule` for JWT guard dependencies
   - Fixed HttpService injection scope

3. ✅ **JWT Authentication Guard**
   - Added introspection query bypass
   - Checks for `__schema` and `__type` queries
   - Checks for `IntrospectionQuery` operation name
   - Allows schema exploration without authentication

4. ✅ **Apollo Server Configuration**
   - Enabled introspection: `introspection: true`
   - Configured landing page: `embed: true, includeCookies: true`
   - Disabled CSRF prevention for development

### Frontend Solution
5. ✅ **Apollo Sandbox Headers**
   - **Removed manual Content-Type header**
   - Only include Authorization and X-Tenant-ID

---

## Testing

### Test 1: Introspection (No Auth)
```bash
curl -X POST http://localhost:3014/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { queryType { name } } }"}'
```

Expected:
```json
{"data":{"__schema":{"queryType":{"name":"Query"}}}}
```

### Test 2: Data Query (Auth Required)
```bash
curl -X POST http://localhost:3014/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ invoices { id } }"}'
```

Expected:
```json
{"errors":[{"message":"No token provided","code":"UNAUTHENTICATED"}]}
```

### Test 3: Authenticated Query
```bash
curl -X POST http://localhost:3014/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-ID: default" \
  -d '{"query":"{ invoices { id invoiceNumber } }"}'
```

Expected: Returns invoice data

---

## Key Learnings

### 1. GraphQL Client Headers
**GraphQL clients like Apollo Sandbox automatically handle:**
- `Content-Type: application/json`
- Request body formatting
- JSON serialization

**You should only manually set:**
- Authentication headers (`Authorization`)
- Custom headers (`X-Tenant-ID`, `X-API-Key`, etc.)

### 2. Browser Console Noise
The 400 errors in browser console are **normal**:
- Apollo Sandbox makes test requests during initialization
- Some requests are intentionally empty to test server behavior
- CSP warnings about `studio.apollographql.com` are from Apollo's CDN (not our server)

**Real errors to watch for:**
- CORS errors (red, start with "Access-Control")
- Network errors (ERR_CONNECTION_REFUSED)
- Authentication errors from actual queries

### 3. Introspection vs. Data Queries
- **Introspection** (`__schema`, `__type`): Public, no auth required
- **Data queries** (`invoices`, `invoice`): Protected, require JWT
- This separation is correct and secure

---

## Related Files

### Backend
- `services/finance/src/infrastructure/graphql/federation.config.ts` - Apollo Server config
- `services/finance/src/infrastructure/guards/jwt-auth.guard.ts` - JWT auth with introspection bypass
- `services/finance/src/infrastructure/auth/auth.module.ts` - Auth module for DI
- `services/finance/src/main.ts` - Service bootstrap with CORS

### Documentation
- `APOLLO_SANDBOX_COMPLETE.md` - Comprehensive implementation guide
- `APOLLO_SANDBOX_TROUBLESHOOTING.md` - Detailed debugging steps
- `GRAPHQL_QUICK_REFERENCE.md` - GraphQL API reference

---

## Status
✅ **RESOLVED**
- Apollo Sandbox introspection working
- Schema loading correctly
- Authentication properly enforced
- Ready for development use

**Last Updated**: 2025-10-14
**Service**: Finance Service (port 3014)
**Apollo Server**: 4.12.2 with Federation v2
