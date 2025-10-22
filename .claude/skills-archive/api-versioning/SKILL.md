---
name: api-versioning
version: 1.0.0
triggers:
  - "deprecate"
  - "version"
  - "breaking change"
  - "migration"
  - "@deprecated"
  - "schema evolution"
  - "api contract"
  - "backward compat"
  - "federation versioning"
auto_load_knowledge:
  - sessions/knowledge/vextrus-erp/patterns/api-versioning-patterns.md
---

# API Versioning & Schema Evolution Skill

**Auto-activates on**: "deprecate", "version", "breaking change", "migration", "schema evolution"

**Purpose**: Enforce GraphQL schema evolution, deprecation strategies, and API versioning best practices for Vextrus ERP's 11+ federated microservices.

---

## When This Skill Activates

Use when implementing or reviewing:
- GraphQL schema changes (field additions, type modifications)
- Field deprecation with `@deprecated` directive
- Breaking changes in API contracts
- Federation v2 schema coordination across services
- Client migration paths
- API versioning strategies
- Schema changelog generation

---

## Codebase Context (Exploration Evidence)

**Current State** (as of 2025-10-20):
- ❌ **ZERO** `@deprecated` directives across all services
- ❌ No formal API versioning infrastructure
- ✅ Apollo Federation v2 active (11+ services)
- ✅ Nullable-field expansion strategy (implicit versioning)
- 🔴 **High-Stakes**: Bangladesh compliance (VAT rates, Mushak-6.3) means schema changes impact regulatory reporting

**Services Analyzed**:
- Finance: 631-line schema (Invoice, Payment, Journal, ChartOfAccount)
- Master Data: Customer, Vendor, Product entities
- Auth: User federation reference resolution
- Total: 11 production + 7 in-progress services

**Key Files**:
- `services/finance/src/presentation/graphql/schema/finance.schema.graphql` (631 lines)
- `services/finance/src/infrastructure/graphql/federation.config.ts` (Federation v2 setup)
- `services/master-data/src/graphql/customer.resolver.ts` (Federation reference pattern)

---

## Core Principles

### 1. GraphQL Schema Evolution Rules

**Safe Changes (Non-Breaking)**:
- ✅ Adding nullable fields
- ✅ Adding new types
- ✅ Adding new queries/mutations
- ✅ Adding new enum values (at end)
- ✅ Deprecating fields (with @deprecated)

**Unsafe Changes (Breaking)**:
- ❌ Removing fields
- ❌ Renaming fields/types
- ❌ Changing field types
- ❌ Making nullable fields non-nullable
- ❌ Removing enum values
- ❌ Changing argument types
- ❌ Adding required arguments

**Decision Tree**:
```
Field change?
  → Adding nullable field? → Safe (deploy immediately)
  → Adding required field? → Breaking (deprecate old, add new version)
  → Removing field? → Breaking (deprecate 60 days, then remove)
  → Changing type? → Breaking (add new field, deprecate old)
```

---

### 2. Deprecation Pattern (@deprecated Directive)

**Standard Deprecation Decorator**:

```graphql
type Invoice @key(fields: "id") {
  # Deprecated field (old pattern)
  totalAmount: Float @deprecated(reason: "Use 'grandTotal' for consistency with accounting standards. Migration: grandTotal.amount")

  # New field (replacement)
  grandTotal: Money!

  # Deprecated field with timeline
  mushakNumber: String @deprecated(reason: "Replaced by 'mushakRegistrationNumber' for NBR compliance. Sunset: 2025-12-20. Migration: mushakRegistrationNumber")

  # New field (replacement)
  mushakRegistrationNumber: String!
}
```

**Deprecation Message Format**:
```
@deprecated(
  reason: "<WHY deprecated> [Replacement: <FIELD_NAME>] [Sunset: <DATE>] [Migration: <STEPS>]"
)
```

**Example from Vextrus Finance Service**:
```graphql
type PaymentMethod {
  # ❌ Current (no deprecation tracking)
  type: PaymentMethodType!

  # ✅ With deprecation
  bankAccount: BankAccountDetails @deprecated(reason: "Use 'paymentDetails.bankAccount' for unified structure. Sunset: 2026-01-15.")
  mobileWallet: MobileWalletDetails @deprecated(reason: "Use 'paymentDetails.mobileWallet' for unified structure. Sunset: 2026-01-15.")

  # New unified field
  paymentDetails: PaymentDetails!
}
```

---

### 3. Deprecation Timeline (3-Phase Rollout)

**Phase 1: Announce (Day 0)**:
- Add `@deprecated` directive to schema
- Update GraphQL introspection
- Publish changelog
- Notify clients via email/Slack
- Add console warnings in development

**Phase 2: Monitor (Days 1-60)**:
- Log deprecated field usage
- Track client adoption of new fields
- Send weekly deprecation reports
- Support client migration

**Phase 3: Remove (Day 60+)**:
- Remove deprecated field from schema
- Deploy new schema version
- Monitor for errors
- Rollback plan ready

**Timeline by Change Type**:
- Minor deprecations (UI fields): 30 days
- Standard deprecations (API fields): 60 days
- Major deprecations (core entities): 90 days
- Bangladesh compliance fields (Mushak, TIN): 120 days (coordinate with NBR)

---

## Schema Evolution Patterns

### 4. Adding New Fields (Safe)

```graphql
# ✅ Safe: Nullable field addition
type Invoice @key(fields: "id") {
  id: String!
  invoiceNumber: String!

  # NEW: Bangladesh Mushak-6.3 compliance (added 2025-10-20)
  mushhakGenerationDate: DateTime

  # NEW: E-invoice support (added 2025-11-01)
  eInvoiceQRCode: String
}
```

**Pattern**:
- Always nullable initially
- Add field description with date added
- Document purpose (e.g., "Bangladesh Mushak-6.3 compliance")
- No `@deprecated` needed

---

### 5. Changing Field Types (Breaking → Migration Path)

**Problem**: Change `Invoice.totalAmount: Float` → `Invoice.totalAmount: Money`

**Solution 1: Parallel Fields (Gradual Migration)**

```graphql
type Invoice @key(fields: "id") {
  # ❌ Old field (deprecated)
  totalAmount: Float @deprecated(reason: "Use 'grandTotal' for multi-currency support. Sunset: 2025-12-20. Migration: grandTotal.amount")

  # ✅ New field (replacement)
  grandTotal: Money!
}
```

**Solution 2: Union Types (Advanced)**

```graphql
union InvoiceTotal = InvoiceTotalV1 | InvoiceTotalV2

type InvoiceTotalV1 {
  amount: Float! @deprecated(reason: "Use InvoiceTotalV2")
}

type InvoiceTotalV2 {
  money: Money!
  currency: String!
}

type Invoice @key(fields: "id") {
  total: InvoiceTotal!
}
```

**Evidence from Codebase**:
- Finance service uses `Money` type consistently (finance.schema.graphql:22-27)
- No legacy Float fields found (already migrated)
- Pattern to follow for future type changes

---

### 6. Enum Evolution (Additive Safe, Removal Breaking)

**Adding Enum Values (Safe)**:

```graphql
enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  # ✅ Safe: Add new status
  PROCESSING
  RECONCILED # Added 2025-10-20 for bank reconciliation
}
```

**Removing Enum Values (Breaking → Deprecation)**:

```graphql
enum InvoiceStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  VOID
  # ❌ Want to remove: CANCELLED (use VOID instead)
}

# Migration path: Mark as deprecated in type
type Invoice @key(fields: "id") {
  status: InvoiceStatus!

  # Add deprecation note in documentation
  """
  Status field notes:
  - CANCELLED is deprecated (use VOID)
  - VOID replaces CANCELLED since 2025-10-20
  """
}
```

**Best Practice**:
- Never remove enum values (breaks clients)
- Instead: Add new value, deprecate old, document mapping
- Example: `CANCELLED → VOID` mapping in resolver logic

---

### 7. Input Type Versioning

**Problem**: Need to change CreateInvoiceInput structure

**Solution: Separate Input Types by Version**

```graphql
# V1 Input (deprecated)
input CreateInvoiceInputV1 @deprecated(reason: "Use CreateInvoiceInput (V2) for multi-currency support") {
  vendorId: String!
  customerId: String!
  lineItems: [LineItemInput!]!
  totalAmount: Float!
}

# V2 Input (current)
input CreateInvoiceInput {
  vendorId: String!
  customerId: String!
  lineItems: [LineItemInput!]!
  grandTotal: MoneyInput!
  currency: String! # NEW: Required for multi-currency
}

# Mutation (supports both)
type Mutation {
  createInvoiceV1(input: CreateInvoiceInputV1!): Invoice @deprecated(reason: "Use createInvoice (V2)")
  createInvoice(input: CreateInvoiceInput!): Invoice
}
```

**Evidence from Codebase**:
- Current pattern: `CreateInvoiceInput` vs `UpdateInvoiceInput` (no versioning)
- Opportunity: Add V1/V2 suffix for breaking input changes
- File: `services/finance/src/presentation/graphql/dto/invoice.dto.ts`

---

## Federation v2 Versioning

### 8. Coordinating Schema Evolution Across Services

**Problem**: Invoice (Finance) references Vendor (Master Data) - both need to evolve together

**Pattern: Federated Entity Versioning**

```graphql
# Master Data Service (vendor.schema.graphql)
type Vendor @key(fields: "id") {
  id: String!
  name: String!

  # NEW: TIN validation added (2025-10-20)
  tin: String @deprecated(reason: "Use 'taxIdentificationNumber' for NBR compliance. Sunset: 2026-01-01")
  taxIdentificationNumber: String
}

# Finance Service (finance.schema.graphql)
extend type Vendor @key(fields: "id", resolvable: false) {
  id: String! @external
  # Don't extend deprecated fields
}

type Invoice @key(fields: "id") {
  vendor: Vendor # References latest Vendor schema
}
```

**Coordination Checklist**:
- [ ] Announce schema change to all federated services
- [ ] Update gateway schema composition
- [ ] Deploy upstream service first (Master Data)
- [ ] Deploy downstream services (Finance) after
- [ ] Monitor gateway for composition errors
- [ ] Rollback plan: Revert gateway composition, then services

**Evidence from Codebase**:
- Federation v2 active: `@link(url: "https://specs.apollo.dev/federation/v2.0")`
- External types: Vendor, Customer marked `@key(fields: "id", resolvable: false)`
- File: `services/finance/src/presentation/graphql/schema/finance.schema.graphql:6-20`

---

### 9. Breaking Change Detection (CI/CD Integration)

**Schema Diff Tool (GraphQL Inspector)**:

```bash
# Install
npm install -D @graphql-inspector/cli

# Detect breaking changes
graphql-inspector diff \
  old-schema.graphql \
  new-schema.graphql

# Output:
# ✖ Field 'Invoice.totalAmount' was removed
# ✔ Field 'Invoice.grandTotal' was added
# ⚠ Field 'Invoice.mushakNumber' is deprecated
```

**CI/CD Integration** (GitHub Actions):

```yaml
# .github/workflows/schema-check.yml
name: GraphQL Schema Check

on: [pull_request]

jobs:
  schema-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Detect breaking changes
        run: |
          npx @graphql-inspector/cli diff \
            main:schema.graphql \
            HEAD:schema.graphql \
            --fail-on-breaking

      - name: Require approval for breaking changes
        if: failure()
        run: echo "Breaking changes detected! Manual approval required."
```

**Evidence from Codebase**:
- No schema check currently (opportunity to add)
- Finance service schema: `services/finance/src/presentation/graphql/schema/finance.schema.graphql`
- Pattern to implement in CI/CD

---

## Bangladesh Compliance Considerations

### 10. High-Stakes Field Changes (Regulatory Impact)

**NBR-Related Fields** (Require 120-day deprecation):
- `mushakNumber` → `mushakRegistrationNumber`
- `challanNumber` → `governmentChallanNumber`
- `vatCategory` enum changes
- `supplementaryDuty` calculation fields
- `advanceIncomeTax` fields

**Pattern: Extended Deprecation with Regulatory Context**:

```graphql
type Invoice @key(fields: "id") {
  mushakNumber: String @deprecated(
    reason: "Renamed to 'mushakRegistrationNumber' for NBR compliance with Mushak-6.3 updated guidelines (October 2025).
    Sunset: 2026-02-20 (120 days).
    Migration: Copy value from mushakRegistrationNumber field.
    Regulatory Impact: Reports using old field will fail NBR validation after sunset date."
  )

  mushakRegistrationNumber: String!
}
```

**Checklist for NBR Field Changes**:
- [ ] 120-day deprecation timeline
- [ ] Document NBR regulation reference
- [ ] Coordinate with accounting team
- [ ] Update Mushak-6.3 report templates
- [ ] Test with NBR validation service
- [ ] Backup plan: Keep old field as alias for 180 days

**Evidence from Codebase**:
- Finance schema lines 40-92: VAT categories, Mushak fields
- `supplementaryDuty`, `advanceIncomeTax` calculations
- File: `services/finance/src/presentation/graphql/schema/finance.schema.graphql`

---

## Client Migration Guidance

### 11. Generating Migration Guides from @deprecated

**Automated Changelog Generation**:

```typescript
// tools/generate-changelog.ts
import { buildSchema, introspectionFromSchema } from 'graphql';

function extractDeprecations(schema: GraphQLSchema): Deprecation[] {
  const types = schema.getTypeMap();
  const deprecations: Deprecation[] = [];

  Object.values(types).forEach(type => {
    if ('getFields' in type) {
      Object.values(type.getFields()).forEach(field => {
        if (field.isDeprecated) {
          deprecations.push({
            type: type.name,
            field: field.name,
            reason: field.deprecationReason,
            addedDate: extractDate(field.deprecationReason, 'Sunset'),
          });
        }
      });
    }
  });

  return deprecations;
}

// Output: CHANGELOG.md
# API Changelog

## 2025-10-20 - Invoice Schema Updates
- **DEPRECATED**: `Invoice.totalAmount` (Float) → Use `Invoice.grandTotal` (Money)
  - Sunset: 2025-12-20
  - Migration: `const amount = invoice.grandTotal.amount`

- **ADDED**: `Invoice.eInvoiceQRCode` (String, nullable)
  - Purpose: E-invoice support for digital receipts
```

---

## Testing Patterns

### 12. Testing Schema Compatibility

```typescript
// schema-compatibility.spec.ts
import { introspectionFromSchema, buildSchema } from 'graphql';

describe('Schema Compatibility', () => {
  it('should not remove fields without deprecation', () => {
    const oldSchema = buildSchema(readFileSync('old-schema.graphql', 'utf8'));
    const newSchema = buildSchema(readFileSync('new-schema.graphql', 'utf8'));

    const removedFields = detectRemovedFields(oldSchema, newSchema);
    const deprecatedFields = getDeprecatedFields(oldSchema);

    removedFields.forEach(field => {
      expect(deprecatedFields).toContain(field);
    });
  });

  it('should deprecate fields at least 60 days before removal', () => {
    const schema = buildSchema(readFileSync('schema.graphql', 'utf8'));
    const deprecations = extractDeprecations(schema);

    deprecations.forEach(dep => {
      const sunsetDate = extractDate(dep.reason, 'Sunset');
      const daysSince = (sunsetDate - new Date()) / (1000 * 60 * 60 * 24);
      expect(daysSince).toBeGreaterThanOrEqual(60);
    });
  });
});
```

---

## Best Practices Summary

1. **Always Use @deprecated**: Never remove fields without 60+ day notice
2. **Parallel Fields**: Add new field, deprecate old, remove after sunset
3. **Type Changes**: Use separate field name (e.g., `totalAmount` → `grandTotal`)
4. **Enum Evolution**: Add new values, never remove old values
5. **Input Versioning**: Use V1/V2 suffix for breaking input changes
6. **Federation Coordination**: Deploy upstream services first
7. **Breaking Change Detection**: CI/CD schema diff before merge
8. **Bangladesh Compliance**: 120-day timeline for NBR fields
9. **Changelog Automation**: Generate from @deprecated directives
10. **Client Migration Guides**: Clear migration path in deprecation reason

---

## Anti-Patterns to Avoid

- ❌ **Removing fields without deprecation** (breaks clients immediately)
- ❌ **Changing field types in place** (silent breaking change)
- ❌ **Renaming fields** (use new field + deprecate old)
- ❌ **Making nullable → non-nullable** (breaks existing queries)
- ❌ **Removing enum values** (use deprecation notes instead)
- ❌ **No deprecation timeline** (clients can't plan migration)
- ❌ **Deprecation without replacement** (no migration path)
- ❌ **Federation schema mismatch** (gateway composition fails)

---

## Vextrus ERP-Specific Guidelines

**For Finance Service**:
- Coordinate schema changes with Master Data (Vendor, Customer references)
- Test with Bangladesh VAT calculators after schema changes
- Update Mushak-6.3 report generators for field changes
- Verify multi-tenancy isolation after schema deployment

**For Federation Gateway**:
- Run `rover subgraph check` before deploying federated schema changes
- Monitor gateway composition errors in production
- Keep rollback schema versions for 7 days

**For All Services**:
- Follow 60-day minimum deprecation timeline
- Document migration path in @deprecated reason
- Generate changelog automatically
- Test schema compatibility in CI/CD

---

## Further Reading

- **Schema Evolution**: `.claude/skills/api-versioning/resources/schema-evolution.md`
- **Breaking Changes**: `.claude/skills/api-versioning/resources/breaking-changes.md`
- **Migration Guide**: `.claude/skills/api-versioning/resources/migration-guide.md`
- **GraphQL Federation**: `sessions/knowledge/vextrus-erp/patterns/graphql-federation-patterns.md`
