# Apollo Sandbox Authentication - Complete Setup Guide

## Overview

This document provides the complete, working solution for using authenticated GraphQL queries with Apollo Sandbox in the Vextrus ERP system.

## ✅ Status: WORKING

**Last Updated**: 2025-10-15
**Authentication**: ✅ Fully Functional
**Apollo Sandbox**: ✅ Fully Functional
**Finance Service GraphQL**: ✅ Fully Functional

---

## Quick Start (3 Steps)

### 1. Generate JWT Token

```powershell
# Run from project root
powershell.exe -ExecutionPolicy Bypass -File register-and-login.ps1
```

This will:
- Register a test user (or use existing)
- Log in and generate fresh JWT token
- Save token to `jwt-token.txt`
- Display Apollo Sandbox JSON format

### 2. Open Apollo Sandbox

```
http://localhost:3014/graphql
```

### 3. Add Headers

Click the **Headers** tab at the bottom and paste:

```json
{
  "Authorization": "Bearer YOUR_TOKEN_HERE",
  "X-Tenant-ID": "default"
}
```

**IMPORTANT**: Do NOT include `Content-Type` header - Apollo Sandbox adds it automatically

---

## Complete Authentication Flow

### Architecture

```
User → Apollo Sandbox → Finance Service → Auth Service → Database
                        (Port 3014)       (Port 3001)
```

### Authentication Steps

1. **User Registration** (One-time)
   - Endpoint: `POST http://localhost:3001/api/v1/auth/register`
   - Creates user account with hashed password
   - Stores user in PostgreSQL `auth.users` table

2. **User Login** (Every 15 minutes)
   - Endpoint: `POST http://localhost:3001/api/v1/auth/login`
   - Validates credentials using bcrypt
   - Returns JWT access token (15 min expiry)
   - Returns refresh token (7 day expiry)

3. **GraphQL Query with Authentication**
   - Apollo Sandbox sends query to Finance Service
   - Finance Service JWT Guard intercepts request
   - Guard extracts Bearer token from Authorization header
   - Guard calls Auth Service: `GET http://auth:3001/api/v1/auth/me`
   - Auth Service validates JWT and returns user details
   - Finance Service executes GraphQL query
   - Finance Service returns results to Apollo Sandbox

---

## Files Modified to Fix Authentication

### 1. Auth Service - Login Handler
**File**: `services/auth/src/application/commands/handlers/login-user.handler.ts`

**Problem**: Tried to load non-existent `organization` and `role` relations
**Fix**: Removed invalid relations parameter

```typescript
// BEFORE (Line 72-74)
const user = await this.userRepository.findOne({
  where: { email: email.toLowerCase() },
  relations: ['organization', 'role'], // ❌ These relations don't exist
});

// AFTER
const user = await this.userRepository.findOne({
  where: { email: email.toLowerCase() },
});
```

### 2. Auth Service - Get User By ID Handler
**File**: `services/auth/src/application/queries/handlers/get-user-by-id.handler.ts`

**Problem**: Same invalid relations issue in the `/api/v1/auth/me` endpoint
**Fix**: Removed invalid relations parameter

```typescript
// BEFORE (Line 34-37)
const user = await this.userRepository.findOne({
  where: { id: userId },
  relations: ['organization', 'role'], // ❌ These relations don't exist
});

// AFTER
const user = await this.userRepository.findOne({
  where: { id: userId },
});
```

### 3. Docker Compose - Finance Service Environment
**File**: `docker-compose.yml`

**Problem**: Finance service defaulted to `localhost:3001` which doesn't work in Docker
**Fix**: Added `AUTH_SERVICE_URL` environment variable

```yaml
# BEFORE (Lines 917-944)
finance:
  environment:
    # ... other vars ...
    # AUTH_SERVICE_URL was missing

# AFTER
finance:
  environment:
    # ... other vars ...
    AUTH_SERVICE_URL: http://auth:3001  # ✅ Use Docker service name
```

**Why This Matters**:
- In Docker, `localhost` refers to the container itself
- Must use Docker service names for inter-container communication
- `auth:3001` resolves to the auth service container's IP

---

## Testing the Complete Flow

### Test 1: User Registration and Login

```powershell
powershell.exe -ExecutionPolicy Bypass -File register-and-login.ps1
```

**Expected Output**:
```
=== Vextrus ERP Authentication ===

1. Registering test user...
   User registered successfully (or already exists)

2. Logging in...
   Login successful

=== JWT TOKEN ===
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

=== REFRESH TOKEN ===
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Token expires in: 900 seconds
```

### Test 2: Apollo Sandbox Introspection

1. Open: `http://localhost:3014/graphql`
2. Click "Headers" tab
3. Add ONLY these headers:
   ```json
   {
     "Authorization": "Bearer YOUR_TOKEN",
     "X-Tenant-ID": "default"
   }
   ```
4. Schema should load successfully

**Expected**: No authentication errors, schema fully visible

### Test 3: Authenticated GraphQL Query

```graphql
query {
  invoices {
    id
    invoiceNumber
    status
    grandTotal {
      amount
      currency
    }
  }
}
```

**Expected Response**:
```json
{
  "data": {
    "invoices": []
  }
}
```

Empty array is correct - no invoices exist yet. Key point: no authentication errors!

### Test 4: Auth Service Endpoint (Direct)

```bash
# Get your token from jwt-token.txt
TOKEN="YOUR_TOKEN_HERE"

curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response**:
```json
{
  "id": "1fc0511c-8613-400e-9c49-be95e3fc92ab",
  "email": "test@vextrus.com",
  "organizationId": "26eae102-fb1a-4295-980d-55525c9376e3",
  "isActive": true,
  "isLocked": false,
  "firstName": "Test",
  "lastName": "User",
  "createdAt": "2025-10-15T07:23:45.678Z",
  "updatedAt": "2025-10-15T07:43:29.048Z"
}
```

---

## Common Issues and Solutions

### Issue 1: "Authentication service unavailable"

**Symptoms**:
```json
{
  "errors": [{
    "message": "Authentication service unavailable",
    "code": "UNAUTHENTICATED"
  }]
}
```

**Root Causes**:
1. ✅ **FIXED**: Invalid relations in auth service handlers
2. ✅ **FIXED**: Missing AUTH_SERVICE_URL in docker-compose
3. Token expired (15 min expiry)

**Solution**:
- Generate new token: `powershell.exe -ExecutionPolicy Bypass -File register-and-login.ps1`
- Verify AUTH_SERVICE_URL is set: `docker exec vextrus-finance printenv | grep AUTH_SERVICE_URL`

### Issue 2: "Cannot query field 'nodes'"

**Symptoms**:
```json
{
  "errors": [{
    "message": "Cannot query field \"nodes\" on type \"Invoice\"."
  }]
}
```

**Cause**: Incorrect GraphQL query syntax

**Solution**: Use direct field access, not relay-style connections:
```graphql
# ❌ WRONG
query {
  invoices {
    nodes {
      id
    }
  }
}

# ✅ CORRECT
query {
  invoices {
    id
  }
}
```

### Issue 3: Apollo Sandbox introspection fails

**Symptoms**: Schema fails to load in Apollo Sandbox

**Cause**: Content-Type header conflicts

**Solution**:
- Remove ALL custom headers
- Add ONLY Authorization and X-Tenant-ID
- Let Apollo Sandbox handle Content-Type automatically

---

## Security Considerations

### Token Expiry
- Access Token: **15 minutes**
- Refresh Token: **7 days**
- Always regenerate tokens when expired

### Production Recommendations

1. **Use HTTPS**: All tokens in production should be over HTTPS
2. **Shorter Expiry**: Consider 5-min access tokens for production
3. **Rotate Secrets**: Change JWT_SECRET regularly
4. **Rate Limiting**: Add rate limiting to login endpoint
5. **Account Lockout**: System locks accounts after 5 failed login attempts

### Development Credentials

**Test User**:
- Email: `test@vextrus.com`
- Username: `testuser`
- Password: `TestPassword123!`
- Organization ID: `26eae102-fb1a-4295-980d-55525c9376e3`

**⚠️ WARNING**: Never use these credentials in production!

---

## Architecture Details

### Service Communication

```
┌─────────────────┐
│ Apollo Sandbox  │
│ (Browser)       │
└────────┬────────┘
         │ HTTP POST /graphql
         │ Headers: Authorization, X-Tenant-ID
         ▼
┌─────────────────┐
│ Finance Service │
│ Port: 3014      │
│ Container: finance │
└────────┬────────┘
         │ HTTP GET /api/v1/auth/me
         │ Headers: Authorization
         ▼
┌─────────────────┐
│ Auth Service    │
│ Port: 3001      │
│ Container: auth │
└────────┬────────┘
         │ SQL Query
         ▼
┌─────────────────┐
│ PostgreSQL      │
│ Database: auth  │
└─────────────────┘
```

### Docker Networking

- Network: `vextrus-network` (bridge)
- Finance → Auth: Uses service name `auth:3001`
- Auth → PostgreSQL: Uses service name `postgres:5432`
- External → Finance: Uses `localhost:3014`

### Environment Variables

**Auth Service**:
```env
JWT_ACCESS_SECRET=vextrus_jwt_access_secret_dev_2024
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=vextrus_jwt_refresh_secret_dev_2024
JWT_REFRESH_EXPIRES_IN=7d
DATABASE_HOST=postgres
DATABASE_NAME=vextrus_auth
```

**Finance Service**:
```env
AUTH_SERVICE_URL=http://auth:3001
JWT_SECRET=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9
DATABASE_HOST=postgres
DATABASE_NAME=vextrus_finance
```

---

## Troubleshooting Commands

### Check Service Status

```bash
# Check if services are running
docker-compose ps auth finance

# Check auth service logs
docker-compose logs auth --tail 50

# Check finance service logs
docker-compose logs finance --tail 50
```

### Verify Environment Variables

```bash
# Check AUTH_SERVICE_URL in finance service
docker exec vextrus-finance printenv | grep AUTH_SERVICE_URL

# Should output: AUTH_SERVICE_URL=http://auth:3001
```

### Test Auth Service Directly

```bash
# Test registration endpoint
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "debug@test.com",
    "username": "debuguser",
    "password": "TestPassword123!",
    "firstName": "Debug",
    "lastName": "User",
    "organizationId": "26eae102-fb1a-4295-980d-55525c9376e3"
  }'

# Test login endpoint
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@vextrus.com",
    "password": "TestPassword123!"
  }'
```

### Rebuild Services

```bash
# Rebuild and restart auth service
docker-compose build auth
docker-compose up -d auth

# Rebuild and restart finance service
docker-compose build finance
docker-compose up -d finance
```

---

## Success Criteria Checklist

Use this checklist to verify your setup:

- [ ] Auth service builds without errors
- [ ] Finance service builds without errors
- [ ] Both services start successfully
- [ ] PowerShell script generates JWT token
- [ ] Token saved to jwt-token.txt
- [ ] Apollo Sandbox loads at http://localhost:3014/graphql
- [ ] Schema introspection succeeds with headers
- [ ] GraphQL query returns data (not auth errors)
- [ ] Auth service logs show no errors
- [ ] Finance service logs show no errors

---

## Next Steps

### For Development

1. **Create Test Data**: Add invoices to test GraphQL queries
2. **Test Mutations**: Try creating/updating invoices
3. **Test Other Services**: Verify auth works across all services
4. **Token Refresh**: Implement token refresh flow

### For Production

1. **Environment Secrets**: Move JWT secrets to secure vault
2. **HTTPS Setup**: Configure SSL/TLS certificates
3. **Rate Limiting**: Add request throttling
4. **Monitoring**: Set up alerts for auth failures
5. **Audit Logging**: Track all authentication events

---

## Related Documentation

- `services/auth/CLAUDE.md` - Auth service architecture
- `services/finance/CLAUDE.md` - Finance service architecture
- `APOLLO_SANDBOX_SOLUTION.md` - Original Apollo Sandbox fix
- `register-and-login.ps1` - Token generation script
- `jwt-token.txt` - Current JWT token storage

---

## Support

If you encounter issues not covered in this guide:

1. Check service logs: `docker-compose logs auth finance --tail 100`
2. Verify environment variables are set correctly
3. Ensure all services are running: `docker-compose ps`
4. Regenerate JWT token if expired
5. Review error messages in Apollo Sandbox Network tab

---

**Document Version**: 1.0
**Last Verified**: 2025-10-15
**Authentication Status**: ✅ Fully Working
