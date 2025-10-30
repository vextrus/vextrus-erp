# How to Import Insomnia Workspace for Master Data Service

## Step-by-Step Import Instructions

### Step 1: Open Insomnia
- Launch Insomnia application

### Step 2: Import the Workspace
1. Click **"Create"** dropdown (top-left)
2. Select **"Import From File"**
3. Navigate to: `C:\Users\riz\vextrus-erp\insomnia-master-data.json`
4. Click **"Open"**

### Step 3: Configure Environment Variables
1. Click **"No Environment"** dropdown (top-left corner)
2. Select **"Base Environment"**
3. Click the **gear icon** ⚙️ next to environment name
4. Update the `jwt_token` field:
   ```json
   {
     "base_url": "http://localhost:3002",
     "tenant_id": "default",
     "jwt_token": "PASTE_YOUR_JWT_TOKEN_HERE"
   }
   ```
5. To get a JWT token, run in terminal:
   ```bash
   node generate-jwt-token.js
   ```
6. Copy the token (WITHOUT the "Bearer " prefix) and paste into `jwt_token` field
7. Click **"Done"**

### Step 4: Test the Requests
You'll see 7 pre-configured requests:

**1. Health Check** (No auth needed)
- Click to open
- Click **"Send"**
- Expected: `{"data":{"__typename":"Query"}}`

**2. Schema Introspection** (No auth needed)
- Shows all available GraphQL queries
- Click **"Send"**

**3. Validate TIN** (Auth required)
- Make sure JWT token is set in environment
- Click **"Send"**
- Expected: `{"data":{"validateTin":true}}`

**4-7. Customer/Vendor/Product Queries** (Auth required)
- These work once you have data in the database

## What's Included

✅ **7 Pre-configured GraphQL Requests**
✅ **Environment Variables** for easy configuration
✅ **Proper Headers** already set up
✅ **Authentication** configured via environment variable

## Quick Start

```bash
# 1. Generate JWT token
node generate-jwt-token.js

# 2. Copy the token output

# 3. Open Insomnia

# 4. Import: Create > Import From File > insomnia-master-data.json

# 5. Set environment: No Environment > Base Environment > ⚙️

# 6. Paste token in jwt_token field

# 7. Test: Click "1. Health Check" > Send
```

## Troubleshooting

### Token Expired Error
- JWT tokens expire after 15 minutes
- Run `node generate-jwt-token.js` to get a new one
- Update the environment variable

### Connection Refused
- Make sure master-data service is running
- Check: `docker-compose ps master-data`
- Start if needed: `docker-compose up -d master-data`

### Invalid Tenant Error
- Ensure `x-tenant-id` header is set to `default`
- Check environment variable is correct

## Next Steps

Once this workspace is working:
1. We'll create similar workspaces for other services
2. Configure federation testing via api-gateway
3. Set up multi-environment support (dev/staging/prod)
