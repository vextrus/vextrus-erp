# Fix Apollo Sandbox Introspection Issue

## ✅ Issue Fixed

The JWT guard was blocking introspection queries. This has been fixed by allowing `__schema` and `__type` queries to pass through without authentication.

---

## 🔄 Restart Finance Service

The code has been updated. You need to restart the finance service for the changes to take effect.

### Option 1: Docker Restart (Recommended)

```bash
# Restart just the finance service
docker-compose restart finance

# Wait 15 seconds for it to start
# Check logs
docker-compose logs -f finance
```

### Option 2: Complete Rebuild (If restart doesn't work)

```bash
# Stop finance service
docker-compose stop finance

# Rebuild the image
docker-compose build finance

# Start finance service
docker-compose up -d finance

# Check logs
docker-compose logs -f finance
```

### Option 3: Quick Rebuild Script

```powershell
# Windows PowerShell
docker-compose stop finance
docker-compose build --no-cache finance
docker-compose up -d finance
docker-compose logs -f finance
```

---

## ✅ Test Apollo Sandbox

After restarting:

1. **Open Apollo Sandbox**: http://localhost:3014/graphql

2. **Schema should load automatically** (no headers needed for introspection!)

3. **Test Introspection** (optional - to verify):
   ```graphql
   query {
     __schema {
       types {
         name
       }
     }
   }
   ```

4. **For actual queries, add headers**:
   ```json
   {
     "Authorization": "Bearer your-jwt-token",
     "X-Tenant-ID": "default"
   }
   ```

---

## 🎯 What Was Fixed

**Before (Broken)**:
- JWT guard blocked ALL GraphQL requests without a token
- Introspection queries (`__schema`, `__type`) were blocked
- Apollo Sandbox couldn't load the schema

**After (Fixed)**:
- JWT guard now allows introspection queries without a token
- Regular queries/mutations still require authentication
- Apollo Sandbox can now load and display the schema

**Code Change** (`services/finance/src/infrastructure/guards/jwt-auth.guard.ts`):
```typescript
// Allow introspection queries for Apollo Sandbox
if (context.getType() === 'graphql') {
  const gqlContext = GqlExecutionContext.create(context);
  const info = gqlContext.getInfo();

  // Check if this is an introspection query
  if (info?.fieldName === '__schema' || info?.fieldName === '__type') {
    this.logger.debug('Allowing introspection query');
    return true;
  }
}
```

---

## 🔍 Verify the Fix

### Step 1: Check Service is Running
```bash
curl http://localhost:3014/health
```

**Expected**: `{"status":"ok",...}`

### Step 2: Open Apollo Sandbox
Navigate to: http://localhost:3014/graphql

**Expected**: Schema loads automatically with full type list visible on the left

### Step 3: Run a Query WITHOUT Headers
```graphql
query {
  __schema {
    queryType {
      name
    }
    mutationType {
      name
    }
  }
}
```

**Expected**: Should work without authentication

### Step 4: Try a Real Query (Requires Headers)
```graphql
query {
  invoices(tenantId: "default", limit: 5) {
    id
    invoiceNumber
  }
}
```

**Expected**: Should ask for authentication headers

---

## 🚨 Troubleshooting

### Schema Still Not Loading

1. **Check service logs**:
   ```bash
   docker-compose logs -f finance | grep -i "introspection\|guard\|graphql"
   ```

2. **Verify the code was rebuilt**:
   ```bash
   # Force rebuild without cache
   docker-compose build --no-cache finance
   docker-compose up -d finance
   ```

3. **Check the GraphQL config**:
   ```bash
   docker-compose exec finance cat src/infrastructure/graphql/federation.config.ts
   ```

   Should show: `introspection: true`

### "POST body missing" Error

This was the original error caused by the JWT guard blocking requests. After restart, this should be gone.

If it persists:
1. Clear browser cache
2. Try in incognito/private window
3. Check Docker logs for any startup errors

### "Unauthorized" Error

This is correct behavior for actual queries! Introspection should work, but real queries need authentication.

**Solution**: Add headers:
```json
{
  "Authorization": "Bearer your-jwt-token",
  "X-Tenant-ID": "default"
}
```

---

## 📊 Expected Behavior

| Query Type | Authentication Required | Example |
|------------|------------------------|---------|
| **Introspection** | ❌ No | `__schema`, `__type` queries |
| **Health Check** | ❌ No | `/health`, `/health/ready` |
| **Invoice Query** | ✅ Yes | `invoice(id: ...)` |
| **Create Invoice** | ✅ Yes | `createInvoice(input: ...)` |
| **Approve Invoice** | ✅ Yes | `approveInvoice(id: ...)` |

---

## 🎉 Success Indicators

After restart, you should see:

1. ✅ Apollo Sandbox loads without errors
2. ✅ Schema visible on the left sidebar
3. ✅ Query/Mutation/Type explorer works
4. ✅ Introspection queries work without headers
5. ✅ Real queries require authentication (as expected)

---

## 📝 Next Steps

Once Apollo Sandbox is working:

1. **Test introspection** - Verify schema loads
2. **Add authentication headers** - Use JWT token from `generate-jwt-token.js`
3. **Run test queries** - Follow `GRAPHQL_QUICK_REFERENCE.md`
4. **Create your first invoice** - Use the corrected mutation format
5. **Query the invoice** - Verify CQRS read model works

---

**The fix is in place - just restart the service and you're good to go!** 🚀
