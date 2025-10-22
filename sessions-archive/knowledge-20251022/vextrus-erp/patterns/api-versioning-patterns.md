# API Versioning Patterns - Quick Reference

**Auto-loaded by**: `api-versioning` skill

---

## Breaking vs Safe Changes

```
Safe Changes (Deploy Immediately):
✅ Add nullable field
✅ Add new type
✅ Add query/mutation
✅ Add enum value (end of list)
✅ Deprecate field (@deprecated)

Breaking Changes (60+ Day Deprecation Required):
❌ Remove field
❌ Change field type
❌ Make nullable → non-nullable
❌ Add required argument
❌ Remove enum value
❌ Rename field/type
```

---

## Deprecation Pattern

```graphql
type Invoice @key(fields: "id") {
  # ❌ Old field (deprecated)
  totalAmount: Float @deprecated(
    reason: "Use 'grandTotal' for multi-currency support.
    Sunset: 2025-12-20.
    Migration: grandTotal.amount"
  )

  # ✅ New field (replacement)
  grandTotal: Money!
}
```

**Deprecation Format**:
```
@deprecated(reason: "<WHY> Replacement: <FIELD>. Sunset: <DATE>. Migration: <STEPS>")
```

---

## Field Type Change Pattern

```graphql
# ❌ NEVER change type in place
type Invoice {
  totalAmount: Money! # Was Float - BREAKS CLIENTS!
}

# ✅ Add new field, deprecate old
type Invoice {
  totalAmount: Float @deprecated(reason: "Use grandTotal")
  grandTotal: Money!
}
```

---

## Input Type Versioning

```graphql
# V1 Input (deprecated)
input CreateInvoiceInputV1 {
  totalAmount: Float!
}

# V2 Input (current)
input CreateInvoiceInput {
  grandTotal: MoneyInput!
}

# Mutations (both supported during migration)
type Mutation {
  createInvoiceV1(input: CreateInvoiceInputV1!): Invoice
    @deprecated(reason: "Use createInvoice. Sunset: 2026-01-01")

  createInvoice(input: CreateInvoiceInput!): Invoice
}
```

---

## Enum Evolution

```graphql
enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  # ✅ Safe: Add new values
  PROCESSING   # Added 2025-11-01
  RECONCILED   # Added 2025-11-05
}

# ❌ NEVER remove enum values
# Instead: Map internally
```

---

## Breaking Change Detection (CI/CD)

```bash
# GraphQL Inspector
npx @graphql-inspector/cli diff \
  schema-old.graphql \
  schema-new.graphql \
  --fail-on-breaking

# Output:
# ✖ Field 'Invoice.totalAmount' was removed
# ✔ Field 'Invoice.grandTotal' was added
# ⚠ Field 'Invoice.mushakNumber' is deprecated
```

**GitHub Actions**:
```yaml
- name: Detect breaking changes
  run: |
    npx @graphql-inspector/cli diff \
      main:schema.graphql \
      HEAD:schema.graphql \
      --fail-on-breaking
```

---

## Federation Breaking Changes

```graphql
# ❌ BREAKING: Change entity key
type Vendor @key(fields: "vendorCode") {
  # Was: @key(fields: "id")
}

# ✅ SAFE: Add composite key
type Vendor @key(fields: "id") @key(fields: "vendorCode") {
  id: String!
  vendorCode: String!
}
```

**Rover Check** (Federation):
```bash
rover subgraph check vextrus-erp-gateway@production \
  --name finance \
  --schema ./schema.graphql
```

---

## Bangladesh Compliance Timeline

**NBR-Critical Fields** (120-day deprecation):
- `mushakNumber`
- `challanNumber`
- `vatCategory`
- `supplementaryDuty`
- `advanceIncomeTax`

```graphql
type Invoice {
  mushakNumber: String @deprecated(
    reason: "Use 'mushakRegistrationNumber' for NBR compliance.
    Sunset: 2026-02-20 (120 days).
    NBR Impact: Mushak-6.3 reports will fail after sunset."
  )

  mushakRegistrationNumber: String!
}
```

---

## Migration Timeline

```
Day 0:   Schema change announced (@deprecated added)
Day 1-7:  Client teams review migration path
Day 8-30: Development (update queries, add tests)
Day 31-45: Deployment (staging → production)
Day 46-59: Monitoring (track usage, send reminders)
Day 60:   Sunset (remove deprecated field)
```

**NBR Fields**: 120-day timeline instead of 60 days

---

## Client Migration Steps

```bash
# 1. Fetch new schema
npx graphql-codegen introspect \
  https://api.vextrus.com/graphql \
  --output schema.graphql

# 2. Generate new types
npm run codegen

# 3. Update queries
# Before
query { invoice { totalAmount } }

# After
query { invoice { grandTotal { amount currency } } }

# 4. Test on staging
export GRAPHQL_ENDPOINT=https://staging-api.vextrus.com/graphql
npm test

# 5. Deploy to production
```

---

## Compatibility Helper (Gradual Migration)

```typescript
// Support both old and new fields
function getInvoiceTotal(invoice: Invoice): number {
  // Prefer new field
  if (invoice.grandTotal) {
    return invoice.grandTotal.amount;
  }

  // Fallback to deprecated field (during migration)
  if (invoice.totalAmount !== undefined) {
    console.warn('Using deprecated totalAmount field');
    return invoice.totalAmount;
  }

  throw new Error('Invoice total not available');
}
```

---

## Rollback Strategy

**Blue-Green Deployment**:
```bash
# Run both versions simultaneously
kubectl scale deployment finance-v1 --replicas=9  # 90% traffic
kubectl scale deployment finance-v2 --replicas=1  # 10% traffic

# Gradual cutover
kubectl scale deployment finance-v2 --replicas=5  # 50%
kubectl scale deployment finance-v1 --replicas=5

# Full migration
kubectl scale deployment finance-v2 --replicas=10 # 100%
kubectl scale deployment finance-v1 --replicas=0
```

**Quick Rollback**:
```bash
# Revert schema version
git checkout finance-service-schema-v1.5.0
kubectl set image deployment/finance finance=finance-service:v1.5.0

# Revert gateway composition (Federation)
rover subgraph publish vextrus-erp-gateway@production \
  --name finance \
  --schema schema-v1.5.0.graphql
```

---

## Monitoring Deprecated Fields

```typescript
// Log deprecated field usage
@Injectable()
export class DeprecatedFieldInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const deprecatedFields = this.findDeprecatedFields(context);

    if (deprecatedFields.length > 0) {
      this.logger.warn(
        `Deprecated fields used: ${deprecatedFields.join(', ')}`,
        { userId, tenantId }
      );

      // Track metrics
      this.metrics.increment('graphql.deprecated_field', {
        field: deprecatedFields[0],
      });
    }

    return next.handle();
  }
}
```

---

## Checklist (Before Deploying Schema Change)

- [ ] Run `graphql-inspector diff` (detect breaking changes)
- [ ] Add `@deprecated` directive (60+ days sunset)
- [ ] Document migration path in deprecation reason
- [ ] Update client libraries (GraphQL codegen)
- [ ] Test with production-like data
- [ ] Notify consuming services (Federation)
- [ ] Create rollback plan (tag schema version)
- [ ] For NBR fields: 120-day timeline, test Mushak-6.3

**Federation-Specific**:
- [ ] Run `rover subgraph check` against production gateway
- [ ] Verify no composition errors
- [ ] Deploy upstream services first (Master Data → Finance)

---

## Common Patterns from Vextrus ERP

**Finance Service** (`services/finance/src/presentation/graphql/schema/finance.schema.graphql`):
- ✅ Consistent `Money` type (amount + currency)
- ✅ Nullable field additions (no breaking changes)
- ✅ Bangladesh-specific fields (mushakNumber, challanNumber)
- ❌ No `@deprecated` directives currently (opportunity)

**Evidence**:
- Federation v2 active (11+ services)
- Nullable-field expansion strategy
- No formal deprecation infrastructure yet

---

## Anti-Patterns to Avoid

- ❌ **Remove fields without @deprecated** (instant client breakage)
- ❌ **Change types in place** (Float → Money without new field)
- ❌ **Short deprecation timeline** (<60 days)
- ❌ **No migration documentation** (clients don't know how to upgrade)
- ❌ **Deploy breaking changes on Friday** (weekend rollback risk)
- ❌ **Wrong Federation order** (Finance before Master Data)

---

## Further Reading

- `.claude/skills/api-versioning/SKILL.md` - Complete versioning guide
- `.claude/skills/api-versioning/resources/schema-evolution.md` - Field addition/removal patterns
- `.claude/skills/api-versioning/resources/breaking-changes.md` - Detection & mitigation
- `.claude/skills/api-versioning/resources/migration-guide.md` - Client update procedures
