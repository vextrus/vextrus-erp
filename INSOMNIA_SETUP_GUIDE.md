# Insomnia Setup Guide - Vextrus ERP Master Data Service

## Quick Start with Insomnia

### Step 1: Create New Request

1. Open Insomnia
2. Click **"New Request"** or press `Ctrl+N`
3. Name it: `Master Data - GraphQL`
4. Select request type: **POST**
5. Change body type to: **GraphQL**

### Step 2: Configure Endpoint

**URL**: `http://localhost:3002/graphql`

### Step 3: Set Headers

Click on **"Header"** tab and add:

```
Content-Type: application/json
x-tenant-id: default
```

**For authenticated requests**, also add:
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

### Step 4: Test Schema Introspection

In the GraphQL query panel, click **"Schema"** → **"Refresh Schema"**

Insomnia will automatically fetch the schema and enable autocomplete!

### Step 5: Try Sample Queries

#### Query 1: Health Check (No Auth Required)
```graphql
{
  __typename
}
```

#### Query 2: Schema Info (No Auth Required)
```graphql
{
  __schema {
    queryType {
      name
      fields {
        name
        description
      }
    }
  }
}
```

#### Query 3: TIN Validation (Requires Auth)
```graphql
{
  validateTin(tin: "1234567890")
}
```

#### Query 4: Get Customers (Requires Auth)
```graphql
query GetCustomers {
  customers(limit: 10, page: 1) {
    data {
      id
      name
      email
      phone
      tin
      status
    }
    total
    page
    limit
    totalPages
    hasNext
    hasPrevious
  }
}
```

#### Query 5: Get Vendors (Requires Auth)
```graphql
query GetVendors {
  vendors(limit: 10, page: 1) {
    data {
      id
      name
      email
      phone
      tin
      vendorType
    }
    total
    totalPages
  }
}
```

#### Query 6: Get Products (Requires Auth)
```graphql
query GetProducts {
  products(limit: 10, page: 1) {
    data {
      id
      name
      sku
      category
      unitPrice
      vatRate
    }
    total
  }
}
```

#### Query 7: Validate Bangladesh NID (Requires Auth)
```graphql
{
  validateNid(nid: "1234567890123")
}
```

#### Query 8: Calculate VAT (Requires Auth)
```graphql
{
  calculateProductVat(amount: 1000, vatRate: 15)
}
```

## Advanced: Environment Variables in Insomnia

### Create Environment

1. Click **"No Environment"** dropdown (top-left)
2. Select **"Manage Environments"**
3. Click **"+"** to add new environment
4. Name it: `Vextrus ERP - Local`

### Add Variables

```json
{
  "base_url": "http://localhost",
  "master_data_port": "3002",
  "tenant_id": "default",
  "auth_token": ""
}
```

### Use Variables in Requests

**URL**: `{{ _.base_url }}:{{ _.master_data_port }}/graphql`

**Headers**:
```
x-tenant-id: {{ _.tenant_id }}
Authorization: Bearer {{ _.auth_token }}
```

## Test Results Reference

Based on our CLI test suite, Master Data service provides:

### ✅ Working Features
- GraphQL endpoint: `http://localhost:3002/graphql`
- Schema introspection: Enabled
- Federation v2: Active
- Authentication: JWT required for data access
- Multi-tenant: Context via `x-tenant-id` header

### 📋 Available Queries

**Customer Management:**
- `customers(limit, page, filter)` - Paginated customer list
- `customer(id)` - Single customer by ID
- `customerByCode(code)` - Find by business code
- `customerByTin(tin)` - Find by TIN number

**Vendor Management:**
- `vendors(limit, page, filter)` - Paginated vendor list
- `vendor(id)` - Single vendor by ID
- `vendorByCode(code)` - Find by business code
- `vendorByTin(tin)` - Find by TIN number

**Product Management:**
- `products(limit, page, filter)` - Paginated product list
- `product(id)` - Single product by ID
- `productBySku(sku)` - Find by SKU
- `productsByCategory(category)` - Filter by category

**Validation Utilities:**
- `validateTin(tin)` - Validate Bangladesh TIN format
- `validateNid(nid)` - Validate Bangladesh NID format
- `validateVendorTin(tin)` - Vendor-specific TIN validation
- `calculateProductVat(amount, vatRate)` - VAT calculation

**Federation:**
- `_entities` - Federation entity resolution
- `_service` - Federation schema SDL

### 🔒 Authentication Requirements

Most queries require JWT authentication. Without it, you'll receive:
```json
{
  "errors": [{
    "message": "Authorization header required",
    "code": "UNAUTHENTICATED"
  }]
}
```

## Pagination Response Structure

All paginated queries return:
```graphql
{
  data: [Item]       # Array of results
  total: Int!        # Total count
  page: Int!         # Current page
  limit: Int!        # Items per page
  totalPages: Int!   # Total pages
  hasNext: Boolean!  # Has next page
  hasPrevious: Boolean!  # Has previous page
}
```

## Next Steps

1. **Get JWT Token**: Contact auth service to generate token
2. **Set Up Environments**: Create dev/staging/prod environments
3. **Create Collections**: Organize requests by feature
4. **Use Autocomplete**: Leverage schema introspection for fast query building
5. **Test Mutations**: Try create/update/delete operations (when implemented)

## CLI Alternative

For automation/scripts, use the test suite:
```bash
bash test-master-data-graphql.sh
```

Or direct curl:
```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query":"{ __typename }"}'
```

---

**Apollo Sandbox Migration Status**: ✅ COMPLETE
**Service Status**: ✅ OPERATIONAL
**Last Verified**: October 7, 2025
