# Apollo Sandbox Troubleshooting Guide

## Current Status

### ✅ What's Working
1. **GraphQL Service**: Running on `http://localhost:3014`
2. **Health Endpoint**: `http://localhost:3014/health` returns 200 OK
3. **Landing Page HTML**: GET request to `/graphql` serves Apollo Sandbox HTML
4. **Introspection via curl**: POST requests with `__schema` queries work without authentication
5. **Authentication Guard**: Regular queries correctly require JWT tokens

### ❌ What's Not Working
- **Apollo Sandbox UI in Browser**: Shows "Unable to reach server" or "Introspection is disabled"

## Test Results

### 1. Health Check ✅
```bash
curl http://localhost:3014/health
# Returns: 200 OK with service health status
```

### 2. Landing Page HTML ✅
```bash
curl -H "Accept: text/html" http://localhost:3014/graphql | head -5
```
Returns:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
```

### 3. Introspection Query ✅
```bash
curl -X POST http://localhost:3014/graphql \
  -H "Content-Type: application/json" \
  -d '{"operationName":"IntrospectionQuery","query":"query IntrospectionQuery { __schema { queryType { name } } }"}'
```
Returns:
```json
{"data":{"__schema":{"queryType":{"name":"Query"}}}}
```

### 4. Authentication Required for Data Queries ✅
```bash
curl -X POST http://localhost:3014/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { invoices { id } }"}'
```
Returns:
```json
{"errors":[{"message":"No token provided","code":"UNAUTHENTICATED"}]}
```

### 5. CORS Configuration ✅
```bash
curl -X OPTIONS http://localhost:3014/graphql \
  -H "Origin: http://localhost:3014" \
  -H "Access-Control-Request-Method: POST"
```
Returns:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
```

## Possible Browser-Specific Issues

### 1. CSP (Content Security Policy)
The Apollo Sandbox HTML includes strict CSP headers that load JavaScript from Apollo CDN:
```
https://apollo-server-landing-page.cdn.apollographql.com
https://embeddable-sandbox.cdn.apollographql.com
https://embed.apollo.graphql.com
```

**Potential Issues:**
- Corporate firewall blocking CDN
- Ad blocker interfering
- Browser extension blocking third-party scripts
- Network proxy issues

### 2. Browser Cache
Old cached responses might be causing issues.

**Solution:**
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Open in Incognito/Private mode
- Clear browser cache for `localhost:3014`

### 3. Browser Developer Console Errors
**Check for:**
- CORS errors (red text starting with "CORS")
- CSP violations ("Content Security Policy")
- Network errors (ERR_CONNECTION_REFUSED)
- JavaScript errors from Apollo CDN scripts

## Debugging Steps

### Step 1: Check Browser DevTools
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for any red error messages
4. Take a screenshot and share

### Step 2: Check Network Tab
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Navigate to `http://localhost:3014/graphql`
4. Look for:
   - Initial HTML request (should be 200 OK)
   - POST requests to `/graphql` (introspection queries)
   - Requests to Apollo CDN (should load scripts)
5. Click on any failed requests
6. Check the Response tab for error messages

### Step 3: Test with HTML File
Open the test file in your browser:
```
file:///C:/Users/riz/vextrus-erp/test-apollo-sandbox.html
```

This will:
- Test introspection without Apollo's CDN dependencies
- Show raw GraphQL responses
- Help isolate if the issue is with Apollo's UI or the GraphQL endpoint

### Step 4: Try Alternative GraphQL Clients

#### Option A: GraphQL Playground (Standalone)
Download from: https://github.com/graphql/graphql-playground/releases

Configure endpoint: `http://localhost:3014/graphql`

#### Option B: Insomnia REST Client
1. Download: https://insomnia.rest/download
2. Create new GraphQL request
3. Set URL: `http://localhost:3014/graphql`
4. Schema will load automatically

#### Option C: Postman
1. Create new GraphQL request
2. Set URL: `http://localhost:3014/graphql`
3. Click "Introspect" to load schema

## Configuration Verification

### Apollo Server Config
Location: `services/finance/src/infrastructure/graphql/federation.config.ts`

Key settings:
```typescript
{
  introspection: true,                    // ✅ Enabled
  playground: false,                      // ✅ Using Sandbox instead
  csrfPrevention: false,                  // ✅ Disabled for development
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({
      embed: true,                        // ✅ Embeds sandbox
      includeCookies: true,
    }),
  ],
}
```

### JWT Guard Introspection Bypass
Location: `services/finance/src/infrastructure/guards/jwt-auth.guard.ts`

Logic:
```typescript
// Allows introspection queries by checking:
1. Field name: __schema or __type
2. Operation name: IntrospectionQuery
3. Query text: contains __schema or __type
```

## Common Solutions

### Solution 1: Browser Issues
```bash
# Try a different browser
- Chrome/Edge
- Firefox
- Safari
```

### Solution 2: Network Issues
```bash
# Verify Docker networking
docker ps | grep finance
docker logs vextrus-finance --tail 50

# Check if port is accessible
netstat -an | findstr :3014
```

### Solution 3: Firewall/Antivirus
```bash
# Temporarily disable firewall/antivirus
# Add exception for localhost:3014
```

### Solution 4: Use Alternative Client
As described in Step 4 above, use Insomnia or Postman instead.

## Advanced Debugging

### Enable Verbose Logging
Edit `services/finance/src/main.ts`:
```typescript
app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
```

Rebuild:
```bash
docker-compose build finance
docker-compose up -d finance
```

### Check Docker Logs
```bash
# Watch logs in real-time
docker logs -f vextrus-finance

# Check for introspection attempts
docker logs vextrus-finance 2>&1 | grep -i "introspection\|__schema"

# Check for authentication errors
docker logs vextrus-finance 2>&1 | grep -i "unauthorized\|token"
```

### Test from Inside Docker Network
```bash
# Execute curl from inside another container
docker exec -it vextrus-postgres curl http://vextrus-finance:3014/health
docker exec -it vextrus-postgres curl http://vextrus-finance:3014/graphql -H "Accept: text/html"
```

## Next Steps

1. **Check Browser DevTools** (most likely issue)
   - Look for CSP violations
   - Check if Apollo CDN scripts are loading
   - Verify no CORS errors

2. **Try test-apollo-sandbox.html**
   - Open in browser
   - Click "Test Introspection Query"
   - Should work if GraphQL endpoint is healthy

3. **Use Alternative Client**
   - Download Insomnia or Postman
   - Connect to `http://localhost:3014/graphql`
   - Schema should load automatically

4. **Check Network Environment**
   - Corporate proxy?
   - VPN active?
   - Firewall rules?

## Contact Information

If the issue persists after trying all debugging steps, provide:
1. Screenshot of Browser DevTools Console tab
2. Screenshot of Browser DevTools Network tab
3. Output of: `docker logs vextrus-finance --tail 100`
4. Output of: `curl -v http://localhost:3014/graphql`
5. Browser name and version

## Related Documentation
- `APOLLO_SANDBOX_COMPLETE.md` - Implementation details
- `FIX_APOLLO_SANDBOX.md` - Original issue tracking
- `GRAPHQL_QUICK_REFERENCE.md` - GraphQL API reference
