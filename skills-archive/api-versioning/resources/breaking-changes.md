# Breaking Changes Detection & Mitigation

**Purpose**: Identify, prevent, and handle breaking changes in GraphQL APIs for Vextrus ERP's federated microservices.

---

## What is a Breaking Change?

**Breaking Change**: A schema modification that causes existing client queries to fail or return unexpected results.

**Impact**: Client applications crash, data corruption, user disruption, regulatory reporting failures (Bangladesh NBR).

---

## Types of Breaking Changes

### 1. Field Removal (Most Common)

**❌ Breaking**:
```graphql
# Before
type Invoice {
  id: String!
  totalAmount: Float!
}

# After (BREAKING!)
type Invoice {
  id: String!
  # totalAmount removed - existing queries fail!
}
```

**Client Impact**:
```graphql
# This query now FAILS
query GetInvoice {
  invoice(id: "123") {
    totalAmount # ❌ Cannot query field "totalAmount" on type "Invoice"
  }
}
```

**✅ Safe Alternative**: Deprecate first, remove later
```graphql
type Invoice {
  id: String!
  totalAmount: Float @deprecated(reason: "Use grandTotal. Sunset: 2026-01-01")
  grandTotal: Money!
}
```

---

### 2. Field Type Change

**❌ Breaking**:
```graphql
# Before
type Invoice {
  totalAmount: Float!
}

# After (BREAKING!)
type Invoice {
  totalAmount: Money! # Type changed Float → Money
}
```

**Client Impact**:
```graphql
# Client expects Float, gets Money object
const amount = invoice.totalAmount; // Was: 100.50, Now: { amount: 100.50, currency: "BDT" }
// Client code breaks: amount.toFixed(2) → Error
```

**✅ Safe Alternative**: Parallel fields
```graphql
type Invoice {
  totalAmount: Float @deprecated(reason: "Use grandTotal")
  grandTotal: Money!
}
```

---

### 3. Nullable → Non-Nullable

**❌ Breaking**:
```graphql
# Before
type Invoice {
  approvedBy: User # Nullable
}

# After (BREAKING!)
type Invoice {
  approvedBy: User! # Now required
}
```

**Client Impact**:
- Existing queries that don't request `approvedBy` now fail
- Old data with `null` values causes validation errors

**✅ Safe Alternative**: 3-phase migration (see schema-evolution.md)

---

### 4. Argument Addition (Required)

**❌ Breaking**:
```graphql
# Before
type Query {
  invoices(limit: Int): [Invoice!]!
}

# After (BREAKING!)
type Query {
  invoices(limit: Int, tenantId: String!): [Invoice!]!
  # Added required argument
}
```

**Client Impact**:
```graphql
# This query now FAILS
query GetInvoices {
  invoices(limit: 10) # Missing required argument "tenantId"
}
```

**✅ Safe Alternative**: Optional argument with default
```graphql
type Query {
  invoices(limit: Int, tenantId: String): [Invoice!]!
  # Optional (context provides default)
}
```

---

### 5. Enum Value Removal

**❌ Breaking**:
```graphql
# Before
enum InvoiceStatus {
  DRAFT
  APPROVED
  CANCELLED
  VOID
}

# After (BREAKING!)
enum InvoiceStatus {
  DRAFT
  APPROVED
  VOID
  # CANCELLED removed - queries filtering by CANCELLED fail
}
```

**Client Impact**:
```graphql
# Fails if server returns CANCELLED status
query GetCancelledInvoices {
  invoices(status: CANCELLED) # ❌ Value "CANCELLED" does not exist in enum
}
```

**✅ Safe Alternative**: Never remove, map internally (see schema-evolution.md)

---

### 6. Union/Interface Changes

**❌ Breaking**:
```graphql
# Before
union PaymentDetails = BankPayment | MobileWallet

# After (BREAKING!)
union PaymentDetails = BankPayment | CreditCard
# MobileWallet removed from union
```

**Client Impact**:
```graphql
# Fragment on MobileWallet fails
fragment PaymentInfo on PaymentDetails {
  ... on MobileWallet { # ❌ Fragment cannot be spread on union
    provider
  }
}
```

**✅ Safe Alternative**: Add types, never remove
```graphql
union PaymentDetails = BankPayment | MobileWallet | CreditCard
```

---

## Breaking Change Detection Tools

### 7. GraphQL Inspector (CI/CD Integration)

**Installation**:
```bash
npm install -D @graphql-inspector/cli
```

**Detect breaking changes**:
```bash
graphql-inspector diff \
  services/finance/schema-old.graphql \
  services/finance/schema-new.graphql \
  --fail-on-breaking
```

**Output**:
```
✖ Field 'Invoice.totalAmount' was removed
  Invoice.totalAmount (Float!) → (removed)

✔ Field 'Invoice.grandTotal' was added
  Invoice.grandTotal (Money!) → (added)

⚠ Field 'Invoice.mushakNumber' is deprecated
  Reason: Use mushakRegistrationNumber. Sunset: 2026-01-01
```

**GitHub Actions Integration**:
```yaml
# .github/workflows/schema-check.yml
name: GraphQL Schema Check

on:
  pull_request:
    paths:
      - 'services/*/src/**/*.graphql'
      - 'services/*/src/**/*.resolver.ts'

jobs:
  schema-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0 # Fetch full history for comparison

      - name: Get base schema (main branch)
        run: |
          git show main:services/finance/src/presentation/graphql/schema/finance.schema.graphql > schema-base.graphql

      - name: Get current schema (PR branch)
        run: |
          cp services/finance/src/presentation/graphql/schema/finance.schema.graphql schema-current.graphql

      - name: Detect breaking changes
        run: |
          npx @graphql-inspector/cli diff \
            schema-base.graphql \
            schema-current.graphql \
            --fail-on-breaking

      - name: Require approval for breaking changes
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.pulls.createReview({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.payload.pull_request.number,
              event: 'REQUEST_CHANGES',
              body: '⚠️ **Breaking changes detected!** Manual approval required. Ensure:\n- `@deprecated` directive added\n- 60+ day sunset timeline\n- Migration path documented'
            });
```

---

### 8. Apollo Studio Schema Checks (Federation)

**For federated schemas** (Vextrus ERP uses Apollo Federation v2):

```bash
# Install Rover CLI
npm install -g @apollo/rover

# Check schema against gateway
rover subgraph check vextrus-erp-gateway@production \
  --name finance \
  --schema ./services/finance/schema.graphql
```

**Output**:
```
BREAKING CHANGES (1):
  ✖ Field Invoice.totalAmount was removed

SAFE CHANGES (2):
  ✔ Field Invoice.grandTotal was added
  ⚠ Field Invoice.mushakNumber is deprecated

❌ FAILED - Breaking changes detected
```

**CI/CD Integration**:
```yaml
- name: Check Federation Schema
  env:
    APOLLO_KEY: ${{ secrets.APOLLO_KEY }}
  run: |
    rover subgraph check vextrus-erp-gateway@production \
      --name finance \
      --schema services/finance/schema.graphql
```

---

## Federation-Specific Breaking Changes

### 9. Entity Key Changes (Federated Entities)

**❌ Breaking**:
```graphql
# Master Data Service (Before)
type Vendor @key(fields: "id") {
  id: String!
  name: String!
}

# Master Data Service (After - BREAKING!)
type Vendor @key(fields: "vendorCode") {
  vendorCode: String! # Changed key from "id" to "vendorCode"
  name: String!
}
```

**Impact**: Finance service references `Vendor` by `id`, now fails to resolve.

**✅ Safe Alternative**: Add composite key
```graphql
type Vendor @key(fields: "id") @key(fields: "vendorCode") {
  id: String!
  vendorCode: String!
  name: String!
}
```

---

### 10. External Field Removal

**❌ Breaking**:
```graphql
# Master Data Service (Before)
type Vendor @key(fields: "id") {
  id: String!
  tin: String! # Tax Identification Number
}

# Master Data Service (After - BREAKING!)
type Vendor @key(fields: "id") {
  id: String!
  # tin removed
}

# Finance Service (References external field)
extend type Vendor @key(fields: "id", resolvable: false) {
  id: String! @external
  tin: String! @external # ❌ Field no longer exists in upstream service
}

type Invoice {
  vendor: Vendor @requires(fields: "tin") # ❌ Cannot require removed field
}
```

**✅ Safe Alternative**: Deprecate in upstream service first
```graphql
# Master Data Service
type Vendor @key(fields: "id") {
  id: String!
  tin: String @deprecated(reason: "Use taxIdentificationNumber. Sunset: 2026-01-01")
  taxIdentificationNumber: String!
}
```

---

## Bangladesh Compliance Breaking Changes

### 11. NBR-Critical Field Changes

**High-Risk Fields** (Mushak-6.3 reporting):
- `mushakNumber`
- `challanNumber`
- `vatCategory`
- `supplementaryDuty`
- `advanceIncomeTax`

**Example: VAT Category Enum Change**

**❌ EXTREMELY DANGEROUS**:
```graphql
# Before
enum VATCategory {
  STANDARD    # 15%
  REDUCED     # 7.5%
  ZERO_RATED  # 0%
  EXEMPT      # No VAT
}

# After (BREAKS NBR REPORTING!)
enum VATCategory {
  STANDARD_15_PERCENT # Renamed - old reports fail
  REDUCED_7_5_PERCENT
  ZERO_RATED
  EXEMPT
}
```

**Impact**:
- Mushak-6.3 reports query by old enum value → fail
- NBR validation service rejects invoices
- Regulatory penalties (Bangladesh VAT Act)

**✅ Safe Alternative**: Never rename, only add
```graphql
enum VATCategory {
  STANDARD
  REDUCED
  ZERO_RATED
  EXEMPT
  # Add new values if needed, but NEVER remove/rename old values
  TRUNCATED  # Added for 2026 NBR regulation changes
}
```

---

### 12. Multi-Currency Migration (Breaking for Reports)

**Scenario**: Finance service migrates from `Float` to `Money` type

**❌ Breaking for NBR Reports**:
```graphql
# Before
type Invoice {
  vatAmount: Float! # NBR reports expect Float
}

# After (BREAKS EXISTING REPORTS!)
type Invoice {
  vatAmount: Money! # Changed to Money type
}
```

**Impact**:
- Existing Mushak-6.3 report generators expect `Float`
- `vatAmount.amount` now required → report queries fail
- NBR submission deadline missed → penalties

**✅ Safe Alternative**: 120-day migration with report update coordination
```graphql
# Phase 1 (Day 0): Add new field
type Invoice {
  vat: Float @deprecated(reason: "Use vatAmount. Sunset: 2026-02-20 (120 days). NBR Impact: Update Mushak-6.3 report templates.")
  vatAmount: Money!
}

# Phase 2 (Days 1-90): Update all report generators
# Phase 3 (Day 120): Remove deprecated field
```

---

## Rollback Strategies

### 13. Schema Rollback Plan

**Preparation** (Before deploying breaking change):

```bash
# 1. Tag current schema version
git tag finance-service-schema-v1.5.0

# 2. Create rollback deployment
kubectl create deployment finance-rollback \
  --image=finance-service:v1.5.0 \
  --replicas=0 # Keep ready, don't start

# 3. Keep gateway composition backup
rover subgraph publish vextrus-erp-gateway@production \
  --name finance \
  --schema schema-v1.5.0.graphql \
  --routing-url https://finance.vextrus.com/graphql
```

**Rollback Execution** (If breaking change causes issues):

```bash
# 1. Scale up rollback deployment
kubectl scale deployment finance-rollback --replicas=3

# 2. Scale down broken deployment
kubectl scale deployment finance --replicas=0

# 3. Revert gateway composition
rover subgraph publish vextrus-erp-gateway@production \
  --name finance \
  --schema schema-v1.5.0.graphql \
  --routing-url https://finance.vextrus.com/graphql

# 4. Monitor for errors
kubectl logs -f deployment/finance-rollback
```

---

### 14. Blue-Green Deployment for Schema Changes

**Pattern**: Run old and new schema versions simultaneously

```yaml
# finance-service-v1.yaml (blue - old schema)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-v1
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: finance
        image: finance-service:v1.5.0
        env:
        - name: GRAPHQL_PATH
          value: /graphql/v1

---
# finance-service-v2.yaml (green - new schema)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-v2
spec:
  replicas: 1 # Start with 1 replica
  template:
    spec:
      containers:
      - name: finance
        image: finance-service:v2.0.0
        env:
        - name: GRAPHQL_PATH
          value: /graphql/v2

---
# Service routes to both versions
apiVersion: v1
kind: Service
metadata:
  name: finance-service
spec:
  selector:
    app: finance # Both v1 and v2 have this label
  ports:
  - port: 80
```

**Gradual Cutover**:
```bash
# Day 1: 10% traffic to v2
kubectl scale deployment finance-v2 --replicas=1
kubectl scale deployment finance-v1 --replicas=9

# Day 3: 50% traffic to v2 (monitor errors)
kubectl scale deployment finance-v2 --replicas=5
kubectl scale deployment finance-v1 --replicas=5

# Day 7: 100% traffic to v2
kubectl scale deployment finance-v2 --replicas=10
kubectl scale deployment finance-v1 --replicas=0
```

---

## Breaking Change Checklist

**Before Deploying Schema Change**:
- [ ] Run `graphql-inspector diff` to detect breaking changes
- [ ] Add `@deprecated` directive if removing/changing field (60+ days)
- [ ] Document migration path in deprecation reason
- [ ] Update client libraries (GraphQL codegen)
- [ ] Test with production-like data
- [ ] Notify all consuming services (Federation)
- [ ] Create rollback plan (schema tag + deployment)
- [ ] For NBR fields: 120-day timeline, coordinate with accounting team

**Federation-Specific**:
- [ ] Run `rover subgraph check` against production gateway
- [ ] Verify no composition errors
- [ ] Deploy upstream services first (Master Data before Finance)
- [ ] Monitor gateway composition health

**Bangladesh Compliance**:
- [ ] Test Mushak-6.3 report generation
- [ ] Verify NBR validation service compatibility
- [ ] Update VAT calculation logic if enum changed
- [ ] Backup current schema version for regulatory audit

---

## Monitoring Breaking Changes in Production

### 15. GraphQL Error Tracking

```typescript
// graphql-error.interceptor.ts
@Injectable()
export class GraphQLErrorInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: Logger,
    private readonly metrics: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const gqlContext = GqlExecutionContext.create(context);
        const info = gqlContext.getInfo();

        // Detect breaking change errors
        if (this.isBreakingChangeError(error)) {
          this.logger.error('Breaking change detected in production', {
            query: info.operation.name,
            field: this.extractFieldFromError(error),
            error: error.message,
            userId: gqlContext.getContext().userId,
            tenantId: gqlContext.getContext().tenantId,
          });

          // Increment breaking change metric
          this.metrics.increment('graphql.breaking_change', {
            field: this.extractFieldFromError(error),
          });

          // Alert on-call engineer
          this.sendPagerDutyAlert(error);
        }

        throw error;
      }),
    );
  }

  private isBreakingChangeError(error: any): boolean {
    return (
      error.message.includes('Cannot query field') ||
      error.message.includes('Field was removed') ||
      error.message.includes('Type mismatch')
    );
  }
}
```

---

## Best Practices Summary

1. **Detect Early**: CI/CD schema checks before merge
2. **Deprecate First**: 60+ days notice (120 for NBR fields)
3. **Parallel Fields**: Add new, deprecate old, remove later
4. **Federation Coordination**: Deploy upstream services first
5. **Rollback Plan**: Tag schema, keep old deployment ready
6. **Blue-Green**: Run old + new versions simultaneously
7. **Monitor**: Track breaking change errors in production
8. **Document**: Clear migration path in @deprecated reason
9. **Test NBR Reports**: Verify Mushak-6.3 compatibility
10. **Never Remove Enum Values**: Map internally instead

---

## Anti-Patterns to Avoid

- ❌ **Deploy schema changes without CI/CD checks**
- ❌ **Remove fields without deprecation notice**
- ❌ **Change types in place (Float → Money)**
- ❌ **Deploy breaking changes on Friday** (weekend rollback risk)
- ❌ **No rollback plan** (hope it works!)
- ❌ **Federation service order wrong** (Finance before Master Data)
- ❌ **Ignore NBR field changes** (regulatory penalties)
- ❌ **Short deprecation timeline** (<60 days)

---

## Further Reading

- **Schema Evolution**: `.claude/skills/api-versioning/resources/schema-evolution.md`
- **Migration Guide**: `.claude/skills/api-versioning/resources/migration-guide.md`
- **GraphQL Inspector**: https://graphql-inspector.com/
- **Apollo Rover**: https://www.apollographql.com/docs/rover/
