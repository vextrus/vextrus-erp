# FINANCE MODULE - PHASE 5: Integration Testing Suite
## Context Continuation Prompt for Next Session

**COPY THIS ENTIRE PROMPT TO START NEXT SESSION:**

---

## Session Context
I'm continuing work on the Vextrus ERP Finance Module. Phase 4 (Bangladesh Validation Middleware) is complete. Now starting Phase 5: Integration Testing Suite.

## Current Status
- **Task**: h-implement-core-finance-module
- **Branch**: feature/finance-module-implementation
- **Location**: C:\Users\riz\vextrus-erp
- **Service**: services/finance

## Completed Work (Phases 1-4)
### Domain Layer ✅
- `ChartOfAccount` entity with NBR-compliant codes
- `JournalEntry` aggregate with event sourcing
- `Invoice` entity with Bangladesh tax compliance
- `Payment` entity with mobile payment support
- `InvoiceLineItem` and `PaymentAllocation` entities
- Tax calculation service (VAT, AIT, TDS)

### Application Layer ✅
- `ChartOfAccountService` with hierarchy management
- `InvoiceService` with approval workflow
- `PaymentService` with allocation logic
- `FinancialReportsService` with NBR reports

### GraphQL Schema ✅
- Complete schema defined in `finance.schema.graphql`
- Extended schema in `finance-extended.schema.graphql`

## Phase 3: Implement GraphQL Resolvers

### Priority 1: Create Resolver Structure
```typescript
// Create these files in services/finance/src/presentation/graphql/resolvers/

1. account.resolver.ts
   - Query: accounts, account, accountByCode, accountBalance
   - Mutation: createAccount, updateAccount, activateAccount

2. journal.resolver.ts
   - Query: journalEntries, journalEntry, journalEntryByNumber
   - Mutation: createJournalEntry, postJournalEntry, reverseJournalEntry

3. invoice.resolver.ts
   - Query: invoices, invoice, invoiceByNumber, overdueInvoices
   - Mutation: createInvoice, approveInvoice, sendInvoice, cancelInvoice

4. payment.resolver.ts
   - Query: payments, payment, paymentByNumber, unallocatedPayments
   - Mutation: createPayment, approvePayment, allocatePayment, reconcilePayment

5. reports.resolver.ts
   - Query: trialBalance, incomeStatement, balanceSheet, generalLedger, vatReport, cashFlow
```

### Priority 2: Connect Services
Each resolver needs to:
1. Inject the corresponding application service
2. Map GraphQL inputs to service DTOs
3. Handle errors with proper GraphQL errors
4. Return properly formatted responses

Example pattern:
```typescript
@Resolver(() => Invoice)
export class InvoiceResolver {
  constructor(
    private readonly invoiceService: InvoiceService,
    @InjectDataLoader('invoice') private loader: DataLoader<string, Invoice>
  ) {}

  @Query(() => [Invoice])
  async invoices(@Args('filter') filter: InvoiceFilter): Promise<Invoice[]> {
    const result = await this.invoiceService.findInvoices(filter);
    return result.invoices;
  }

  @Mutation(() => Invoice)
  async createInvoice(@Args('input') input: CreateInvoiceInput): Promise<Invoice> {
    return await this.invoiceService.createInvoice(input);
  }
}
```

### Priority 3: Add Bangladesh Validations
Create validation decorators for:
- TIN format: 10 digits
- BIN format: 9 digits
- Mobile numbers: 01[3-9]XXXXXXXX
- VAT rate: 15% standard
- Fiscal year: July-June

### Priority 4: Implement Data Loaders
Prevent N+1 queries for:
- Account hierarchies
- Invoice line items
- Payment allocations
- Journal entry lines

### Technical Requirements

#### Dependencies to Install
```json
{
  "@nestjs/graphql": "^10.x",
  "@nestjs/apollo": "^10.x",
  "apollo-server-express": "^3.x",
  "dataloader": "^2.x",
  "graphql": "^16.x",
  "graphql-subscriptions": "^2.x"
}
```

#### Module Registration
```typescript
// In app.module.ts
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: 'schema.gql',
  typePaths: ['./**/*.graphql'],
  resolvers: { JSON: GraphQLJSON },
  context: ({ req }) => ({ req, user: req.user }),
})
```

### Key Integration Points

1. **Invoice → Journal Entry**
   - On invoice approval, create journal entry automatically
   - Map invoice lines to journal lines

2. **Payment → Invoice**
   - Allocate payments to invoices
   - Update invoice balance on allocation

3. **Reports → Journal Entries**
   - All reports pull from posted journal entries
   - Filter by date range and project

### Bangladesh-Specific Rules

1. **Invoice Validation**
   - Require TIN/BIN for B2B transactions
   - VAT must be 15% unless exempted
   - Fiscal year format: YYYY-YYYY

2. **Payment Validation**
   - bKash/Nagad require mobile number
   - Cheques require cheque number and date
   - TDS deduction for certain vendor types

3. **Report Compliance**
   - VAT report must include TIN/BIN
   - Trial balance must balance (debits = credits)
   - All amounts in BDT

### Testing Approach

1. **Unit Tests**
   ```bash
   npm run test:unit -- invoice.resolver
   ```

2. **Integration Tests**
   ```bash
   npm run test:integration -- finance
   ```

3. **GraphQL Playground**
   - Test queries at http://localhost:3000/graphql
   - Use example queries from docs

### Success Criteria
- [ ] All GraphQL queries return correct data
- [ ] All mutations update database properly
- [ ] Bangladesh validations enforced
- [ ] No N+1 query problems
- [ ] Error handling works correctly
- [ ] Authentication/authorization integrated

## Files to Reference
- **Entities**: `services/finance/src/domain/*/entities/*.entity.ts`
- **Services**: `services/finance/src/application/services/*.service.ts`
- **Schemas**: `services/finance/src/presentation/graphql/schemas/*.graphql`
- **DTOs**: Check service files for DTO definitions

## Commands to Run
```bash
# Switch to finance service
cd services/finance

# Install dependencies if needed
npm install

# Generate GraphQL schema
npm run generate:schema

# Start development server
npm run dev

# Run tests
npm run test
```

## Important Notes
1. Event sourcing is already implemented - use it for audit trails
2. All financial transactions must go through journal entries
3. Use existing tax calculation service for VAT/AIT/TDS
4. Construction features (retention, progress billing) are domain-specific
5. Mobile payment methods are critical for Bangladesh market

## Next Session Start
Begin by:
1. Creating the resolver directory structure
2. Implementing the account resolver first (simplest)
3. Testing with GraphQL Playground
4. Moving to invoice resolver (more complex)
5. Finally implementing payment resolver with allocations

Good luck with Phase 3 implementation!