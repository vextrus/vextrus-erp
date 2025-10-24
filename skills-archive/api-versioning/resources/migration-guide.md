# Client Migration Guide

**Purpose**: Step-by-step procedures for migrating client applications when GraphQL schema changes occur in Vextrus ERP services.

---

## Overview

**Migration Scenarios**:
1. Field deprecation → Update queries to use new field
2. Type change → Update GraphQL types in client
3. Input type changes → Update mutation variables
4. Enum evolution → Handle new/removed enum values

**Tools**: GraphQL Code Generator, Apollo Client, schema introspection

---

## Pre-Migration Checklist

**Before starting migration**:
- [ ] Read deprecation notice in GraphQL Playground
- [ ] Check sunset timeline (60-120 days)
- [ ] Review migration path in `@deprecated` reason
- [ ] Download new schema (introspection query)
- [ ] Run `graphql-codegen` to generate new types
- [ ] Create feature branch for migration
- [ ] Test against staging environment

---

## Client Update Procedures

### 1. GraphQL Code Generator Update

**Step 1: Fetch new schema**

```bash
# Introspection query to get latest schema
npx graphql-codegen introspect \
  https://api.vextrus.com/graphql \
  --header "Authorization: Bearer ${AUTH_TOKEN}" \
  --output schema.graphql
```

**Step 2: Update codegen config**

```typescript
// codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'https://api.vextrus.com/graphql',
  documents: ['src/**/*.graphql', 'src/**/*.tsx'],
  generates: {
    './src/lib/graphql/generated/': {
      preset: 'client',
      config: {
        useTypeImports: true,
        enumsAsTypes: true, // Handle new enum values gracefully
        avoidOptionals: false,
        maybeValue: 'T | null', // Handle nullable fields
      },
      plugins: [],
    },
  },
};

export default config;
```

**Step 3: Generate new types**

```bash
npm run codegen
# Or: npx graphql-codegen --config codegen.ts
```

**Output**:
```typescript
// src/lib/graphql/generated/graphql.ts

// ✅ New field added
export type Invoice = {
  __typename?: 'Invoice';
  id: Scalars['String'];
  /** @deprecated Use 'grandTotal' for multi-currency support. Sunset: 2025-12-20 */
  totalAmount?: Maybe<Scalars['Float']>;
  grandTotal: Money; // New field
};

// ✅ Type updated
export type Money = {
  __typename?: 'Money';
  amount: Scalars['Float'];
  currency: Scalars['String'];
};
```

---

### 2. Updating Queries (Field Deprecation)

**Scenario**: `Invoice.totalAmount` deprecated → use `Invoice.grandTotal`

**Before** (using deprecated field):
```graphql
query GetInvoice($id: String!) {
  invoice(id: $id) {
    id
    invoiceNumber
    totalAmount # ⚠ Deprecated
    status
  }
}
```

**After** (using new field):
```graphql
query GetInvoice($id: String!) {
  invoice(id: $id) {
    id
    invoiceNumber
    grandTotal {
      amount
      currency
    }
    status
  }
}
```

**TypeScript Code Update**:

```typescript
// Before
function displayInvoiceTotal(invoice: GetInvoiceQuery['invoice']) {
  return `${invoice.totalAmount.toFixed(2)} BDT`;
}

// After
function displayInvoiceTotal(invoice: GetInvoiceQuery['invoice']) {
  return `${invoice.grandTotal.amount.toFixed(2)} ${invoice.grandTotal.currency}`;
}
```

---

### 3. Gradual Migration Strategy (Parallel Fields)

**Pattern**: Support both old and new fields during migration

```typescript
// invoice.utils.ts
export function getInvoiceTotal(invoice: Invoice): number {
  // Prefer new field, fall back to old field (during migration period)
  if (invoice.grandTotal) {
    return invoice.grandTotal.amount;
  }

  // Fallback to deprecated field (will be removed after sunset)
  if (invoice.totalAmount !== undefined) {
    console.warn('DEPRECATED: invoice.totalAmount is deprecated. Use invoice.grandTotal');
    return invoice.totalAmount;
  }

  throw new Error('Invoice total not available');
}

// Usage (works with old and new queries)
const total = getInvoiceTotal(invoice);
```

**Benefits**:
- Code works with both old and new schema
- Gradual rollout (deploy before schema change)
- Rollback safe (if new schema breaks, old field still works)

---

### 4. Input Type Migration (Mutations)

**Scenario**: `CreateInvoiceInput` changes structure

**Before**:
```graphql
mutation CreateInvoice($input: CreateInvoiceInput!) {
  createInvoice(input: $input) {
    id
    invoiceNumber
  }
}

# Variables
{
  "input": {
    "vendorId": "vendor-1",
    "customerId": "customer-1",
    "totalAmount": 100.50
  }
}
```

**After** (V2 input):
```graphql
mutation CreateInvoice($input: CreateInvoiceInput!) {
  createInvoice(input: $input) {
    id
    invoiceNumber
  }
}

# Variables (updated structure)
{
  "input": {
    "vendorId": "vendor-1",
    "customerId": "customer-1",
    "grandTotal": {
      "amount": 100.50,
      "currency": "BDT"
    }
  }
}
```

**TypeScript Update**:

```typescript
// Before
const input: CreateInvoiceInput = {
  vendorId: 'vendor-1',
  customerId: 'customer-1',
  totalAmount: 100.50,
};

// After (codegen generates new types)
const input: CreateInvoiceInput = {
  vendorId: 'vendor-1',
  customerId: 'customer-1',
  grandTotal: {
    amount: 100.50,
    currency: 'BDT',
  },
};
```

---

### 5. Enum Value Handling

**Scenario**: New `PaymentStatus.PROCESSING` enum value added

**Before** (doesn't handle new value):
```typescript
function getStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'PENDING':
      return 'yellow';
    case 'COMPLETED':
      return 'green';
    case 'FAILED':
      return 'red';
    default:
      // ❌ No handling for PROCESSING
      return 'gray';
  }
}
```

**After** (handles new value):
```typescript
function getStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'PENDING':
      return 'yellow';
    case 'COMPLETED':
      return 'green';
    case 'FAILED':
      return 'red';
    case 'PROCESSING': // ✅ New enum value
      return 'blue';
    case 'RECONCILED': // ✅ Another new value
      return 'purple';
    default:
      // Graceful handling of unknown future values
      console.warn(`Unknown payment status: ${status}`);
      return 'gray';
  }
}
```

**Best Practice**: Always have `default` case for future enum values

---

## Testing Migration

### 6. Compatibility Testing

**Test against both schemas**:

```typescript
// migration.test.ts
describe('Invoice Query Migration', () => {
  describe('Old Schema (deprecated field)', () => {
    it('should work with totalAmount field', async () => {
      const query = gql`
        query GetInvoice($id: String!) {
          invoice(id: $id) {
            id
            totalAmount
          }
        }
      `;

      const { data } = await client.query({ query, variables: { id: '123' } });
      expect(data.invoice.totalAmount).toBe(100.50);
    });
  });

  describe('New Schema (new field)', () => {
    it('should work with grandTotal field', async () => {
      const query = gql`
        query GetInvoice($id: String!) {
          invoice(id: $id) {
            id
            grandTotal {
              amount
              currency
            }
          }
        }
      `;

      const { data } = await client.query({ query, variables: { id: '123' } });
      expect(data.invoice.grandTotal.amount).toBe(100.50);
      expect(data.invoice.grandTotal.currency).toBe('BDT');
    });
  });

  describe('Compatibility Helper', () => {
    it('should handle both old and new fields', () => {
      const oldInvoice = { id: '1', totalAmount: 100 };
      const newInvoice = { id: '2', grandTotal: { amount: 200, currency: 'BDT' } };

      expect(getInvoiceTotal(oldInvoice)).toBe(100);
      expect(getInvoiceTotal(newInvoice)).toBe(200);
    });
  });
});
```

---

### 7. Staging Environment Testing

**Workflow**:

```bash
# 1. Point client to staging API (new schema)
export GRAPHQL_ENDPOINT=https://staging-api.vextrus.com/graphql

# 2. Run full test suite
npm test

# 3. Manual testing checklist
# - Create invoice (new grandTotal field)
# - List invoices (verify both old and new fields present)
# - Filter invoices (test with new enum values)
# - Update invoice (test new input structure)

# 4. Monitor GraphQL errors
# Check browser console for deprecation warnings
```

---

## Rollback Procedures

### 8. Client Rollback (If Schema Change Breaks)

**Scenario**: New schema deployed, clients break

**Quick Rollback** (revert query to use old field):

```typescript
// Feature flag for migration
const USE_NEW_INVOICE_SCHEMA = process.env.FEATURE_NEW_INVOICE_SCHEMA === 'true';

// Query selection based on flag
const query = USE_NEW_INVOICE_SCHEMA
  ? gql`
      query GetInvoice($id: String!) {
        invoice(id: $id) {
          grandTotal {
            amount
            currency
          }
        }
      }
    `
  : gql`
      query GetInvoice($id: String!) {
        invoice(id: $id) {
          totalAmount
        }
      }
    `;
```

**Rollback Steps**:

```bash
# 1. Disable feature flag
export FEATURE_NEW_INVOICE_SCHEMA=false

# 2. Redeploy client
npm run build
npm run deploy

# 3. Verify old query works
curl -X POST https://app.vextrus.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ invoice(id: \"123\") { totalAmount } }"}'
```

---

### 9. Schema Downgrade (Server-Side)

**If server schema needs rollback**:

```bash
# 1. Revert to previous schema version
git checkout finance-service-schema-v1.5.0

# 2. Redeploy service
kubectl set image deployment/finance-service \
  finance=finance-service:v1.5.0

# 3. Update gateway composition (Federation)
rover subgraph publish vextrus-erp-gateway@production \
  --name finance \
  --schema schema-v1.5.0.graphql

# 4. Notify clients (deprecation paused)
```

---

## Migration Timeline Example

### 10. 60-Day Migration Schedule

**Day 0: Schema Change Announced**
- [ ] Schema updated with @deprecated directive
- [ ] Deprecation notice in GraphQL Playground
- [ ] Email sent to all client teams
- [ ] Documentation updated

**Day 1-7: Preparation Phase**
- [ ] Client teams review migration path
- [ ] Update GraphQL codegen config
- [ ] Generate new types
- [ ] Create feature branches

**Day 8-30: Development Phase**
- [ ] Update queries/mutations
- [ ] Add compatibility helpers (support both fields)
- [ ] Write tests for new schema
- [ ] Test against staging environment

**Day 31-45: Deployment Phase**
- [ ] Deploy client updates to staging
- [ ] QA testing (full regression)
- [ ] Deploy to production (gradual rollout)
- [ ] Monitor GraphQL errors

**Day 46-59: Monitoring Phase**
- [ ] Track deprecated field usage (logs)
- [ ] Send reminders to teams still using old field
- [ ] Address any issues/bugs
- [ ] Final warning: 1 day until sunset

**Day 60: Sunset**
- [ ] Server removes deprecated field
- [ ] All clients verified using new field
- [ ] Celebrate migration completion! 🎉

---

## Vextrus-Specific Migration Patterns

### 11. Multi-Tenant Migration

**Challenge**: Different tenants may migrate at different rates

**Pattern**: Tenant-level feature flags

```typescript
// Check tenant's migration status
async function shouldUseNewSchema(tenantId: string): Promise<boolean> {
  const tenant = await tenantRepository.findById(tenantId);
  return tenant.featureFlags.includes('new_invoice_schema');
}

// Query selection based on tenant
const query = await shouldUseNewSchema(currentTenantId)
  ? NEW_INVOICE_QUERY
  : OLD_INVOICE_QUERY;
```

---

### 12. Bangladesh Compliance Migration

**NBR Field Changes** (120-day timeline):

**Example**: `mushakNumber` → `mushakRegistrationNumber`

**Migration Checklist**:
- [ ] Day 0: Deprecation announced
- [ ] Day 1-30: Update Mushak-6.3 report generators
- [ ] Day 31-60: Test with NBR validation service
- [ ] Day 61-90: Deploy updated reports to staging
- [ ] Day 91-119: Production deployment + monitoring
- [ ] Day 120: Remove old `mushakNumber` field

**Report Generator Update**:

```typescript
// Before
function generateMushak63Report(invoices: Invoice[]) {
  return invoices.map(inv => ({
    mushak_number: inv.mushakNumber, // Old field
    total: inv.totalAmount,
  }));
}

// After
function generateMushak63Report(invoices: Invoice[]) {
  return invoices.map(inv => ({
    mushak_registration_number: inv.mushakRegistrationNumber, // New field
    total: inv.grandTotal.amount,
  }));
}
```

---

## Best Practices Summary

1. **Early Testing**: Test against staging immediately after deprecation notice
2. **Feature Flags**: Use flags to toggle between old/new schema
3. **Compatibility Helpers**: Support both old and new fields temporarily
4. **Gradual Rollout**: Deploy clients before schema sunset
5. **Monitor Errors**: Track GraphQL errors during migration
6. **Rollback Plan**: Feature flag to revert if issues occur
7. **60-Day Buffer**: Complete migration well before sunset date
8. **Document Changes**: Update internal docs and onboarding guides
9. **Multi-Tenant**: Consider tenant-level migration tracking
10. **NBR Fields**: 120-day timeline, test with NBR validation

---

## Migration Checklist Template

**Copy this for each migration**:

```markdown
# Migration: Invoice.totalAmount → Invoice.grandTotal

**Sunset Date**: 2025-12-20 (60 days)
**Impact**: All invoice-related queries
**Migration Path**: Replace `totalAmount` with `grandTotal.amount`

## Tasks
- [ ] Read deprecation notice
- [ ] Update codegen config
- [ ] Generate new types (`npm run codegen`)
- [ ] Update queries (5 files)
- [ ] Update TypeScript code (3 utility functions)
- [ ] Add compatibility helper
- [ ] Write tests (old + new schema)
- [ ] Test on staging
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Remove compatibility helper (after sunset)

## Files Changed
- [ ] src/queries/invoice.graphql
- [ ] src/utils/invoice.ts
- [ ] src/components/InvoiceList.tsx
- [ ] src/components/InvoiceDetail.tsx
- [ ] tests/invoice.test.ts

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Staging deployment successful
- [ ] Production smoke test successful
```

---

## Further Reading

- **Schema Evolution**: `.claude/skills/api-versioning/resources/schema-evolution.md`
- **Breaking Changes**: `.claude/skills/api-versioning/resources/breaking-changes.md`
- **GraphQL Codegen**: https://the-guild.dev/graphql/codegen
- **Apollo Client Migration**: https://www.apollographql.com/docs/react/v3/migrating/
