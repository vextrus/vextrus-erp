# Apollo Sandbox Test Scenarios - Finance Service

This document provides comprehensive test scenarios for testing the Finance service GraphQL API via Apollo Sandbox.

## Prerequisites

1. **Start the Finance service**:
   ```bash
   cd services/finance
   npm run start:dev
   ```

2. **Open Apollo Sandbox**: http://localhost:3014/graphql

3. **Generate JWT Token** (for testing):
   ```bash
   node generate-jwt-token.js
   ```

4. **Set HTTP Headers in Apollo Sandbox**:
   ```json
   {
     "Authorization": "Bearer YOUR_JWT_TOKEN_FROM_SCRIPT",
     "X-Tenant-ID": "default",
     "Content-Type": "application/json"
   }
   ```

   **Note**: Use `"default"` as the tenant ID for development/testing.

---

## Test Scenario 1: Create Invoice

### GraphQL Mutation
```graphql
mutation CreateInvoice {
  createInvoice(input: {
    customerId: "customer-001"
    vendorId: "vendor-001"
    invoiceDate: "2025-01-15"
    dueDate: "2025-02-15"
    lineItems: [
      {
        description: "Construction Materials - Steel Rods"
        quantity: 100
        unitPrice: 5000
        currency: "BDT"
        vatCategory: STANDARD
      }
    ]
    vendorTIN: "1234567890"
    vendorBIN: "123456789"
    customerTIN: "0987654321"
    customerBIN: "987654321"
  }) {
    id
    invoiceNumber
    status
    subtotal { amount formattedAmount }
    vatAmount { amount formattedAmount }
    grandTotal { amount formattedAmount }
    fiscalYear
    mushakNumber
    createdAt
  }
}
```

### Expected Response
```json
{
  "data": {
    "createInvoice": {
      "id": "uuid-generated",
      "invoiceNumber": "INV-2025-01-15-000001",
      "status": "DRAFT",
      "subtotal": {
        "amount": 500000,
        "formattedAmount": "৳500,000.00"
      },
      "vatAmount": {
        "amount": 75000,
        "formattedAmount": "৳75,000.00"
      },
      "grandTotal": {
        "amount": 575000,
        "formattedAmount": "৳575,000.00"
      },
      "fiscalYear": "2024-2025",
      "mushakNumber": null,
      "createdAt": "2025-01-15T..."
    }
  }
}
```

### VAT Category Options
- `STANDARD` - 15% VAT (most goods/services)
- `REDUCED` - 7.5% VAT (specific categories per NBR)
- `TRUNCATED` - 5% VAT (small businesses)
- `ZERO_RATED` - 0% VAT (exports, certain essentials)
- `EXEMPT` - VAT exempt (education, health, financial services)

---

## Test Scenario 2: Query Invoice

```graphql
query GetInvoice($id: ID!) {
  invoice(id: $id) {
    id
    invoiceNumber
    status
    grandTotal { amount formattedAmount }
  }
}
```

---

## Test Scenario 3: Approve Invoice

```graphql
mutation ApproveInvoice($id: ID!) {
  approveInvoice(id: $id) {
    id
    status
    mushakNumber
  }
}
```

Expected: Status changes to APPROVED, mushakNumber assigned.

---

For complete test scenarios, see the full documentation.
