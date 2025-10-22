# GraphQL Schema Evolution Guide

**Purpose**: Comprehensive patterns for evolving GraphQL schemas safely without breaking clients in Vextrus ERP's federated microservices.

---

## Overview

**Schema Evolution**: The process of adding, modifying, or removing GraphQL types, fields, and operations while maintaining backwards compatibility.

**Core Principle**: **Backwards Compatibility First** - Existing clients must continue working after schema changes.

**Safe vs Unsafe Changes**:
- **Safe**: Add nullable fields, new types, new queries/mutations, enum values
- **Unsafe**: Remove fields, change types, make nullable → non-nullable, remove enum values

---

## Adding Fields (Safe Pattern)

### 1. Nullable Field Addition

**Pattern**: Always add new fields as nullable initially

```graphql
# Before
type Invoice @key(fields: "id") {
  id: String!
  invoiceNumber: String!
  grandTotal: Money!
  status: InvoiceStatus!
}

# After (✅ Safe)
type Invoice @key(fields: "id") {
  id: String!
  invoiceNumber: String!
  grandTotal: Money!
  status: InvoiceStatus!

  # NEW: E-invoice support (added 2025-11-01)
  eInvoiceQRCode: String

  # NEW: Bangladesh Mushak-6.3 generation timestamp
  mushakGenerationDate: DateTime

  # NEW: Payment link for online payments
  paymentLink: String
}
```

**Why Safe?**
- Existing queries don't need to request new fields
- GraphQL introspection shows new fields immediately
- Clients opt-in to new fields gradually

**Evidence from Vextrus Codebase**:
- Finance service: All new fields added as nullable
- Example: `BankAccountDetails`, `MobileWalletDetails` added without breaking existing Payment queries
- File: `services/finance/src/presentation/graphql/schema/finance.schema.graphql:96-111`

---

### 2. Non-Nullable Field Addition (Unsafe → Migration Required)

**Problem**: Want to add `Invoice.approvedBy: User!` (required field)

**❌ Bad Approach (Breaking)**:

```graphql
type Invoice @key(fields: "id") {
  id: String!
  approvedBy: User! # ❌ Breaks existing queries that don't include this field
}
```

**✅ Good Approach (3-Step Migration)**:

**Step 1: Add as nullable** (Day 0)

```graphql
type Invoice @key(fields: "id") {
  id: String!
  approvedBy: User # Nullable initially
}
```

**Step 2: Populate existing data** (Days 1-30)

```typescript
// Migration script
async function backfillApprovedBy() {
  const invoices = await invoiceRepo.find({ approvedBy: null });

  for (const invoice of invoices) {
    invoice.approvedBy = await getUserWhoApproved(invoice.id);
    await invoiceRepo.save(invoice);
  }
}
```

**Step 3: Make non-nullable** (Day 30+)

```graphql
type Invoice @key(fields: "id") {
  id: String!
  approvedBy: User! # Now safe (all data populated)
}
```

---

## Changing Field Types (Unsafe → Parallel Field Pattern)

### 3. Type Change with Parallel Fields

**Problem**: Change `Invoice.totalAmount: Float` → `Invoice.totalAmount: Money`

**❌ Bad Approach (Breaking)**:

```graphql
# Before
type Invoice {
  totalAmount: Float!
}

# After (BREAKS CLIENTS!)
type Invoice {
  totalAmount: Money! # ❌ Type changed in place
}
```

**✅ Good Approach (Parallel Field Strategy)**:

**Phase 1: Add new field, deprecate old** (Day 0)

```graphql
type Invoice @key(fields: "id") {
  # ❌ Old field (deprecated)
  totalAmount: Float @deprecated(
    reason: "Use 'grandTotal' for multi-currency support and consistency with accounting standards.
    Sunset: 2025-12-20.
    Migration: grandTotal.amount gives you the numeric value."
  )

  # ✅ New field (replacement)
  grandTotal: Money!
}
```

**Phase 2: Update clients** (Days 1-60)

```graphql
# Old client query (still works)
query GetInvoice($id: String!) {
  invoice(id: $id) {
    totalAmount # ⚠ Deprecated warning in GraphQL Playground
  }
}

# New client query (recommended)
query GetInvoice($id: String!) {
  invoice(id: $id) {
    grandTotal {
      amount
      currency
    }
  }
}
```

**Phase 3: Remove deprecated field** (Day 60)

```graphql
type Invoice @key(fields: "id") {
  grandTotal: Money! # Old totalAmount removed
}
```

**Evidence from Vextrus Codebase**:
- Finance service already uses `Money` type consistently
- No legacy `Float` amount fields found (clean migration completed)
- Pattern: `grandTotal`, `subtotal`, `vatAmount` all use `Money` type
- File: `services/finance/src/presentation/graphql/schema/finance.schema.graphql:22-27, 285-333`

---

### 4. Resolver Implementation for Parallel Fields

```typescript
// invoice.resolver.ts
@Resolver(() => Invoice)
export class InvoiceResolver {
  @Query(() => Invoice)
  async invoice(@Args('id') id: string): Promise<Invoice> {
    const invoice = await this.invoiceService.findById(id);

    return {
      ...invoice,
      // Support both fields during migration
      totalAmount: invoice.grandTotal.amount, // Deprecated field (compute from grandTotal)
      grandTotal: invoice.grandTotal, // New field
    };
  }
}
```

**Deprecation Warning in Development**:

```typescript
// Add console warning for deprecated field usage
@Resolver(() => Invoice)
export class InvoiceResolver {
  @ResolveField(() => Float, { nullable: true, deprecationReason: '...' })
  totalAmount(@Parent() invoice: Invoice): number {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'DEPRECATED: Invoice.totalAmount is deprecated. Use Invoice.grandTotal instead.',
      );
    }
    return invoice.grandTotal.amount;
  }

  @ResolveField(() => Money)
  grandTotal(@Parent() invoice: Invoice): Money {
    return invoice.grandTotal;
  }
}
```

---

## Enum Evolution

### 5. Adding Enum Values (Safe)

**Pattern**: Add new enum values at the end

```graphql
# Before
enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
}

# After (✅ Safe)
enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  # ✅ New values added at end
  PROCESSING   # Added 2025-11-01: For async payment gateway processing
  RECONCILED   # Added 2025-11-05: For bank reconciliation workflow
}
```

**Why Safe?**
- Existing queries don't see new values unless they query data with new status
- GraphQL validation allows unknown enum values in responses
- Clients can handle new values gracefully (`default` case in switch statements)

**Client Handling**:

```typescript
// Client code (TypeScript)
function getStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'PENDING':
      return 'yellow';
    case 'COMPLETED':
      return 'green';
    case 'FAILED':
      return 'red';
    case 'PROCESSING':
      return 'blue';
    case 'RECONCILED':
      return 'purple';
    default:
      // Handle unknown future values gracefully
      console.warn(`Unknown payment status: ${status}`);
      return 'gray';
  }
}
```

---

### 6. Removing Enum Values (Unsafe → Deprecation Pattern)

**Problem**: Want to remove `InvoiceStatus.CANCELLED` (use `VOID` instead)

**❌ Bad Approach (Breaking)**:

```graphql
# Before
enum InvoiceStatus {
  DRAFT
  APPROVED
  CANCELLED
  VOID
}

# After (BREAKS CLIENTS!)
enum InvoiceStatus {
  DRAFT
  APPROVED
  VOID # ❌ CANCELLED removed (clients querying cancelled invoices will fail)
}
```

**✅ Good Approach (Alias + Deprecation)**:

**Phase 1: Add deprecation note** (cannot deprecate enum values directly in GraphQL, use docs)

```graphql
enum InvoiceStatus {
  DRAFT
  APPROVED

  """
  DEPRECATED: Use VOID instead. CANCELLED will be removed on 2026-01-01.
  Migration: Update queries to filter by VOID status instead.
  """
  CANCELLED

  VOID
}
```

**Phase 2: Map deprecated value in resolver** (Days 1-90)

```typescript
// invoice.service.ts
async function getInvoiceStatus(invoice: Invoice): InvoiceStatus {
  // Map CANCELLED → VOID internally
  if (invoice.status === 'CANCELLED') {
    return InvoiceStatus.VOID;
  }
  return invoice.status;
}

// Update all CANCELLED records to VOID
async function migrateInvoiceStatuses() {
  await db.query(`
    UPDATE invoices
    SET status = 'VOID'
    WHERE status = 'CANCELLED'
  `);
}
```

**Phase 3: Remove enum value** (Day 90)

```graphql
enum InvoiceStatus {
  DRAFT
  APPROVED
  VOID # CANCELLED removed (all data migrated)
}
```

**Evidence from Vextrus Codebase**:
- Finance service enums: `InvoiceStatus`, `PaymentStatus`, `JournalStatus`, `PaymentMethodType`
- No deprecated enum values currently (clean enum design)
- File: `services/finance/src/presentation/graphql/schema/finance.schema.graphql:29-39, 116-121`

---

## Input Type Evolution

### 7. Input Type Versioning (Breaking Changes)

**Problem**: Need to change `CreateInvoiceInput` to require multi-currency support

**❌ Bad Approach (Breaking)**:

```graphql
# Before
input CreateInvoiceInput {
  vendorId: String!
  customerId: String!
  totalAmount: Float!
}

# After (BREAKS EXISTING MUTATIONS!)
input CreateInvoiceInput {
  vendorId: String!
  customerId: String!
  grandTotal: MoneyInput! # ❌ Field renamed, old clients fail
  currency: String!       # ❌ New required field, old clients fail
}
```

**✅ Good Approach (Parallel Input Types)**:

**Phase 1: Create V2 input, keep V1** (Day 0)

```graphql
# V1 Input (deprecated)
input CreateInvoiceInputV1 {
  vendorId: String!
  customerId: String!
  lineItems: [LineItemInputV1!]!
  totalAmount: Float!
}

# V2 Input (current)
input CreateInvoiceInput {
  vendorId: String!
  customerId: String!
  lineItems: [LineItemInput!]!
  grandTotal: MoneyInput!
}

# Mutations (both supported)
type Mutation {
  createInvoiceV1(input: CreateInvoiceInputV1!): Invoice
    @deprecated(reason: "Use createInvoice for multi-currency support. Sunset: 2026-01-01.")

  createInvoice(input: CreateInvoiceInput!): Invoice
}
```

**Phase 2: Resolver handles both versions** (Days 1-90)

```typescript
// invoice.resolver.ts
@Mutation(() => Invoice)
async createInvoiceV1(
  @Args('input') input: CreateInvoiceInputV1,
): Promise<Invoice> {
  // Convert V1 input to V2 internally
  const v2Input: CreateInvoiceInput = {
    vendorId: input.vendorId,
    customerId: input.customerId,
    lineItems: input.lineItems,
    grandTotal: {
      amount: input.totalAmount,
      currency: 'BDT', // Default currency for legacy clients
    },
  };

  return this.createInvoice(v2Input);
}

@Mutation(() => Invoice)
async createInvoice(
  @Args('input') input: CreateInvoiceInput,
): Promise<Invoice> {
  // V2 implementation
  const command = new CreateInvoiceCommand({
    ...input,
    tenantId: this.context.tenantId,
  });

  return this.commandBus.execute(command);
}
```

**Phase 3: Remove V1 mutation** (Day 90)

```graphql
type Mutation {
  createInvoice(input: CreateInvoiceInput!): Invoice
  # createInvoiceV1 removed
}
```

---

## Nested Type Evolution

### 8. Adding Nested Fields

**Pattern**: Nested types evolve independently

```graphql
# Before
type Invoice @key(fields: "id") {
  id: String!
  lineItems: [LineItem!]!
}

type LineItem {
  description: String!
  quantity: Int!
  unitPrice: Money!
  amount: Money!
}

# After (✅ Safe)
type LineItem {
  description: String!
  quantity: Int!
  unitPrice: Money!
  amount: Money!

  # ✅ New nested fields (nullable)
  vatCategory: VATCategory      # Added 2025-11-01
  vatRate: Float                # Added 2025-11-01
  vatAmount: Money              # Added 2025-11-01
  hsCode: String                # Added 2025-11-05 (Bangladesh customs code)
  supplementaryDuty: Money      # Added 2025-11-05 (NBR compliance)
}
```

**Evidence from Vextrus Codebase**:
- Finance service: `LineItem` type with VAT fields, HS code, supplementary duty
- Nested evolution pattern: Add fields to `LineItem` without versioning `Invoice`
- File: `services/finance/src/presentation/graphql/schema/finance.schema.graphql:44-92`

---

### 9. Changing Nested Type Structure (Union Types)

**Problem**: `PaymentDetails` needs to support multiple payment method structures

**Before**:

```graphql
type Payment @key(fields: "id") {
  id: String!
  method: PaymentMethodType!
  bankAccount: BankAccountDetails   # Only for bank payments
  mobileWallet: MobileWalletDetails # Only for mobile payments
}
```

**After (✅ Union Type Pattern)**:

```graphql
type Payment @key(fields: "id") {
  id: String!
  method: PaymentMethodType!

  # Old fields (deprecated)
  bankAccount: BankAccountDetails @deprecated(reason: "Use 'paymentDetails' union type")
  mobileWallet: MobileWalletDetails @deprecated(reason: "Use 'paymentDetails' union type")

  # New union field
  paymentDetails: PaymentDetails!
}

# Union type (extensible)
union PaymentDetails =
  | BankPaymentDetails
  | MobileWalletPaymentDetails
  | CreditCardPaymentDetails
  | CashPaymentDetails

type BankPaymentDetails {
  accountNumber: String!
  routingNumber: String!
  bankName: String!
}

type MobileWalletPaymentDetails {
  provider: String!      # bKash, Nagad, Rocket
  mobileNumber: String!
  transactionId: String!
}
```

**Resolver with Union**:

```typescript
@Resolver(() => Payment)
export class PaymentResolver {
  @ResolveField(() => PaymentDetails)
  paymentDetails(@Parent() payment: Payment): typeof PaymentDetails {
    switch (payment.method) {
      case PaymentMethodType.BANK_TRANSFER:
        return payment.bankAccountDetails;
      case PaymentMethodType.MOBILE_WALLET:
        return payment.mobileWalletDetails;
      default:
        throw new Error(`Unknown payment method: ${payment.method}`);
    }
  }

  // Support deprecated fields during migration
  @ResolveField(() => BankAccountDetails, { nullable: true })
  bankAccount(@Parent() payment: Payment): BankAccountDetails | null {
    return payment.method === PaymentMethodType.BANK_TRANSFER
      ? payment.bankAccountDetails
      : null;
  }
}
```

**Evidence from Vextrus Codebase**:
- Finance service: `BankAccountDetails` and `MobileWalletDetails` currently as separate fields (opportunity for union type pattern)
- File: `services/finance/src/presentation/graphql/schema/finance.schema.graphql:96-111`

---

## Deprecation Workflows

### 10. Standard Deprecation Process

**Step 1: Add @deprecated directive**

```graphql
type Invoice @key(fields: "id") {
  totalAmount: Float @deprecated(
    reason: "Use 'grandTotal' for multi-currency support.
    Sunset: 2025-12-20.
    Migration: grandTotal.amount"
  )
  grandTotal: Money!
}
```

**Step 2: Log deprecated field usage**

```typescript
// deprecated-field.interceptor.ts
@Injectable()
export class DeprecatedFieldInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();

    const deprecatedFields = this.findDeprecatedFields(info.fieldNodes);

    if (deprecatedFields.length > 0) {
      this.logger.warn(
        `Deprecated fields used: ${deprecatedFields.join(', ')}`,
        {
          query: info.operation.name,
          userId: gqlContext.getContext().userId,
          tenantId: gqlContext.getContext().tenantId,
        },
      );

      // Store metrics for deprecation tracking
      this.trackDeprecatedFieldUsage(deprecatedFields);
    }

    return next.handle();
  }

  private findDeprecatedFields(fieldNodes: FieldNode[]): string[] {
    // Extract deprecated fields from GraphQL query
    const fields: string[] = [];
    fieldNodes.forEach(node => {
      if (this.isFieldDeprecated(node.name.value)) {
        fields.push(node.name.value);
      }
    });
    return fields;
  }
}
```

**Step 3: Generate deprecation report**

```typescript
// tools/deprecation-report.ts
import { buildSchema, introspectionFromSchema } from 'graphql';

async function generateDeprecationReport() {
  const schema = buildSchema(readFileSync('schema.graphql', 'utf8'));
  const deprecations = extractDeprecations(schema);

  console.log('# Deprecation Report\n');
  console.log(`Total deprecated fields: ${deprecations.length}\n`);

  deprecations.forEach(dep => {
    const sunsetDate = extractDate(dep.reason, 'Sunset');
    const daysRemaining = (sunsetDate - new Date()) / (1000 * 60 * 60 * 24);

    console.log(`## ${dep.type}.${dep.field}`);
    console.log(`- Sunset: ${sunsetDate.toISOString().split('T')[0]}`);
    console.log(`- Days remaining: ${Math.floor(daysRemaining)}`);
    console.log(`- Reason: ${dep.reason}\n`);
  });
}
```

**Step 4: Remove deprecated field** (after sunset date)

```graphql
type Invoice @key(fields: "id") {
  grandTotal: Money! # totalAmount removed
}
```

---

## Bangladesh-Specific Schema Evolution

### 11. NBR Compliance Field Changes

**High-Stakes Fields** (120-day deprecation required):

```graphql
type Invoice @key(fields: "id") {
  # OLD: Mushak number (deprecated)
  mushakNumber: String @deprecated(
    reason: "Renamed to 'mushakRegistrationNumber' for NBR compliance with Mushak-6.3 updated guidelines (October 2025).
    Sunset: 2026-02-20 (120 days).
    Migration: Copy value from mushakRegistrationNumber field.
    Regulatory Impact: Reports using old field will fail NBR validation after sunset date."
  )

  # NEW: Mushak registration number (NBR-compliant naming)
  mushakRegistrationNumber: String!

  # OLD: Generic VAT field
  vat: Float @deprecated(
    reason: "Use 'vatAmount' (Money type) for precise tax calculations.
    Sunset: 2026-02-20.
    Migration: vatAmount.amount
    NBR Impact: Floating-point precision issues in old field may cause Mushak-6.3 validation errors."
  )

  # NEW: VAT amount (precise money type)
  vatAmount: Money!
}
```

**Evidence from Vextrus Codebase**:
- Finance service: `mushakNumber`, `challanNumber` (Bangladesh-specific fields)
- VAT calculations: `vatCategory`, `vatRate`, `vatAmount`
- Supplementary duty: `supplementaryDuty` (NBR compliance)
- File: `services/finance/src/presentation/graphql/schema/finance.schema.graphql:40-92`

---

## Testing Schema Evolution

### 12. Schema Compatibility Tests

```typescript
// schema-evolution.spec.ts
import { introspectionFromSchema, buildSchema } from 'graphql';

describe('Schema Evolution Compatibility', () => {
  const oldSchema = buildSchema(readFileSync('old-schema.graphql', 'utf8'));
  const newSchema = buildSchema(readFileSync('new-schema.graphql', 'utf8'));

  it('should not remove fields without deprecation', () => {
    const oldFields = extractAllFields(oldSchema);
    const newFields = extractAllFields(newSchema);
    const removedFields = oldFields.filter(f => !newFields.includes(f));

    const deprecatedFields = extractDeprecatedFields(oldSchema);

    removedFields.forEach(field => {
      expect(deprecatedFields).toContain(field);
    });
  });

  it('should not change field types without deprecation', () => {
    const typeChanges = detectTypeChanges(oldSchema, newSchema);

    typeChanges.forEach(change => {
      // Old field should be deprecated
      expect(isFieldDeprecated(oldSchema, change.type, change.field)).toBe(true);
      // New field should exist with different name
      expect(hasAlternativeField(newSchema, change.type, change.field)).toBe(true);
    });
  });

  it('should have migration path for all deprecations', () => {
    const deprecations = extractDeprecations(newSchema);

    deprecations.forEach(dep => {
      expect(dep.reason).toMatch(/Migration:/);
      expect(dep.reason).toMatch(/Sunset:/);
    });
  });
});
```

---

## Best Practices Summary

1. **Always Add Nullable**: New fields start as nullable
2. **Parallel Fields**: Add new, deprecate old, remove after sunset
3. **Never Change Types In Place**: Use new field name
4. **Enum Values**: Add at end, never remove
5. **Input Versioning**: Use V1/V2 suffix for breaking changes
6. **Union Types**: For extensible nested structures
7. **Log Deprecations**: Track usage for migration monitoring
8. **60-Day Minimum**: Standard deprecation timeline
9. **120-Day for NBR**: Bangladesh compliance fields
10. **Clear Migration Path**: Document in @deprecated reason

---

## Anti-Patterns to Avoid

- ❌ **Removing fields without @deprecated** (breaks clients immediately)
- ❌ **Changing types in place** (silent breaking change)
- ❌ **Making nullable → non-nullable** (breaks existing queries)
- ❌ **Removing enum values** (breaks switch statements)
- ❌ **No migration documentation** (clients don't know how to upgrade)
- ❌ **Short deprecation timeline** (<60 days, clients can't plan)
- ❌ **Deprecation without replacement** (no upgrade path)

---

## Further Reading

- **Breaking Changes**: `.claude/skills/api-versioning/resources/breaking-changes.md`
- **Migration Guide**: `.claude/skills/api-versioning/resources/migration-guide.md`
- **GraphQL Best Practices**: https://graphql.org/learn/best-practices/#versioning
- **Apollo Federation**: https://www.apollographql.com/docs/federation/
