# Test-First Patterns

**Auto-loaded by**: test-first skill

**Purpose**: TDD patterns for critical features in Vextrus ERP

---

## Pattern 1: Financial Calculation TDD

**Context**: Money calculations (invoice totals, VAT, discounts)

**When to Use**: All features involving Money value object

**Red-Green-Refactor Example**:
```typescript
// === RED: Write failing test ===
describe('Invoice VAT calculation (Bangladesh)', () => {
  it('should apply 15% VAT to BDT 1000 subtotal', () => {
    const invoice = new Invoice({
      subtotal: Money.BDT(1000),
      vatRate: 15,
    });

    invoice.calculateTax();

    expect(invoice.vat.amount).toBe(150);
    expect(invoice.total.amount).toBe(1150);
  });
});

// Run: npm test -- invoice.spec.ts
// Result: ❌ FAILED - calculateTax() not defined

// === GREEN: Minimal implementation ===
class Invoice {
  calculateTax(): void {
    this.vat = this.subtotal.multiply(this.vatRate / 100);
    this.total = this.subtotal.add(this.vat);
  }
}

// Run: npm test -- invoice.spec.ts
// Result: ✅ PASSED

// === REFACTOR: Add edge cases and improve ===
describe('Invoice VAT calculation edge cases', () => {
  it('should handle zero VAT rate', () => {
    const invoice = new Invoice({ subtotal: Money.BDT(1000), vatRate: 0 });
    invoice.calculateTax();
    expect(invoice.vat.amount).toBe(0);
  });

  it('should round VAT to 2 decimal places', () => {
    const invoice = new Invoice({ subtotal: Money.BDT(100.33), vatRate: 15 });
    invoice.calculateTax();
    expect(invoice.vat.amount).toBe(15.05);  // Rounded
  });

  it('should reject negative VAT rate', () => {
    const invoice = new Invoice({ subtotal: Money.BDT(1000), vatRate: -5 });
    expect(() => invoice.calculateTax()).toThrow('VAT rate cannot be negative');
  });
});

// Refactored implementation
class Invoice {
  calculateTax(): void {
    if (this.vatRate < 0) {
      throw new DomainException('VAT rate cannot be negative');
    }
    this.vat = this.calculateVAT();
    this.total = this.calculateTotal();
  }

  private calculateVAT(): Money {
    if (this.vatRate === 0) return Money.zero(this.currency);
    return this.subtotal.multiply(this.vatRate / 100).round(2);
  }

  private calculateTotal(): Money {
    return this.subtotal.add(this.vat);
  }
}

// Run all tests: ✅ ALL PASSED (100% coverage)
```

**Vextrus ERP Example**:
- File: `services/finance/src/domain/aggregates/invoice.aggregate.ts`
- Tests: `services/finance/src/domain/aggregates/invoice.aggregate.spec.ts`
- Coverage: 100%
- Production bugs: 0

---

## Pattern 2: Payment Processing TDD

**Context**: Payment amounts, status transitions, reconciliation

**When to Use**: All payment-related features

**Example**:
```typescript
// === RED: Payment validation ===
describe('Payment.validate()', () => {
  it('should reject payment amount greater than invoice total', () => {
    const invoice = new Invoice({ total: Money.BDT(1000) });
    const payment = new Payment({
      amount: Money.BDT(1500),
      invoiceId: invoice.id,
    });

    expect(() => payment.validate()).toThrow(
      'Payment amount cannot exceed invoice total'
    );
  });

  it('should accept payment amount equal to invoice total', () => {
    const invoice = new Invoice({ total: Money.BDT(1000) });
    const payment = new Payment({
      amount: Money.BDT(1000),
      invoiceId: invoice.id,
    });

    expect(() => payment.validate()).not.toThrow();
  });

  it('should accept partial payment', () => {
    const invoice = new Invoice({ total: Money.BDT(1000) });
    const payment = new Payment({
      amount: Money.BDT(500),
      invoiceId: invoice.id,
    });

    expect(() => payment.validate()).not.toThrow();
    expect(payment.isPartial()).toBe(true);
  });
});

// === GREEN: Implementation ===
class Payment {
  validate(): void {
    const invoice = this.getInvoice();

    if (this.amount.isGreaterThan(invoice.total)) {
      throw new DomainException(
        'Payment amount cannot exceed invoice total'
      );
    }

    if (this.amount.isLessThan(Money.zero(this.currency))) {
      throw new DomainException('Payment amount must be positive');
    }
  }

  isPartial(): boolean {
    const invoice = this.getInvoice();
    return this.amount.isLessThan(invoice.total);
  }
}
```

**Vextrus ERP Example**:
- File: `services/finance/src/domain/aggregates/payment.aggregate.ts`
- Tests: 12 tests, 100% coverage
- Prevents: Overpayment bugs, negative payments

---

## Pattern 3: CQRS Command Testing

**Context**: Command handlers with side effects

**When to Use**: All CQRS commands that modify state

**Integration Test Pattern**:
```typescript
describe('ApproveInvoiceHandler (integration)', () => {
  let handler: ApproveInvoiceHandler;
  let repository: InvoiceRepository;
  let eventBus: EventBus;
  let connection: Connection;

  beforeAll(async () => {
    connection = await createTestDatabaseConnection();
    repository = connection.getCustomRepository(InvoiceRepository);
    eventBus = new EventBus();
    handler = new ApproveInvoiceHandler(repository, eventBus);
  });

  afterAll(async () => {
    await connection.close();
  });

  afterEach(async () => {
    await repository.clear();
    eventBus.clearEvents();
  });

  // === RED: Write failing test ===
  it('should approve pending invoice and emit event', async () => {
    // ARRANGE
    const invoice = await repository.save(
      new Invoice({
        customerId: 'customer-123',
        status: InvoiceStatus.PENDING,
        lineItems: [{ amount: Money.BDT(1000) }],
      })
    );

    const command = new ApproveInvoiceCommand(invoice.id, 'user-456');

    // ACT
    await handler.execute(command);

    // ASSERT - Check database
    const updated = await repository.findById(invoice.id);
    expect(updated.status).toBe(InvoiceStatus.APPROVED);
    expect(updated.approvedBy).toBe('user-456');

    // ASSERT - Check events
    const events = eventBus.getPublishedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(InvoiceApprovedEvent);
    expect(events[0].invoiceId).toBe(invoice.id);
  });

  it('should reject approval of non-pending invoice', async () => {
    const invoice = await repository.save(
      new Invoice({ status: InvoiceStatus.APPROVED })
    );

    const command = new ApproveInvoiceCommand(invoice.id, 'user-456');

    await expect(handler.execute(command)).rejects.toThrow(
      'Only pending invoices can be approved'
    );
  });
});
```

**Vextrus ERP Example**:
- File: `services/finance/src/application/commands/approve-invoice.handler.ts`
- Tests: Integration tests with real database
- Coverage: 85%

---

## Pattern 4: Event Sourcing TDD

**Context**: Domain aggregates with event sourcing

**When to Use**: All event-sourced aggregates

**Example**:
```typescript
describe('InvoiceAggregate event sourcing', () => {
  it('should emit InvoiceCreated event when creating invoice', () => {
    // ARRANGE
    const command = {
      customerId: 'customer-123',
      lineItems: [{ amount: Money.BDT(1000), description: 'Consulting' }],
    };

    // ACT
    const invoice = InvoiceAggregate.create(command);

    // ASSERT - Check state
    expect(invoice.customerId).toBe('customer-123');
    expect(invoice.status).toBe(InvoiceStatus.PENDING);

    // ASSERT - Check events
    const events = invoice.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(InvoiceCreatedEvent);
    expect(events[0].customerId).toBe('customer-123');
  });

  it('should reconstruct from events', () => {
    // ARRANGE
    const events = [
      new InvoiceCreatedEvent({
        invoiceId: 'invoice-123',
        customerId: 'customer-123',
        lineItems: [{ amount: 1000 }],
      }),
      new InvoiceApprovedEvent({
        invoiceId: 'invoice-123',
        approvedBy: 'user-456',
        approvedAt: new Date(),
      }),
    ];

    // ACT
    const invoice = InvoiceAggregate.fromEvents(events);

    // ASSERT
    expect(invoice.id).toBe('invoice-123');
    expect(invoice.status).toBe(InvoiceStatus.APPROVED);
    expect(invoice.approvedBy).toBe('user-456');
    expect(invoice.getUncommittedEvents()).toHaveLength(0);  // No new events
  });
});
```

**Vextrus ERP Example**:
- File: `services/finance/src/domain/aggregates/invoice.aggregate.ts`
- Pattern: Event sourcing with event replay
- Tests: Event emission + reconstruction

---

## Pattern 5: GraphQL Resolver E2E Testing

**Context**: Full stack GraphQL API testing

**When to Use**: Critical GraphQL mutations and queries

**E2E Test Pattern**:
```typescript
describe('Invoice GraphQL API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApplication();
    authToken = await getAuthToken(app, 'manager@company.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create and approve invoice via GraphQL', async () => {
    // STEP 1: Create invoice
    const createResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation CreateInvoice($input: CreateInvoiceInput!) {
            createInvoice(input: $input) {
              success
              data {
                id
                status
                total
              }
            }
          }
        `,
        variables: {
          input: {
            customerId: 'customer-123',
            lineItems: [
              { amount: 1000, description: 'Consulting', vatRate: 15 }
            ],
          },
        },
      })
      .set('Authorization', `Bearer ${authToken}`);

    expect(createResponse.body.data.createInvoice.success).toBe(true);
    const invoiceId = createResponse.body.data.createInvoice.data.id;
    expect(createResponse.body.data.createInvoice.data.status).toBe('PENDING');
    expect(createResponse.body.data.createInvoice.data.total).toBe(1150);  // 1000 + 15% VAT

    // STEP 2: Approve invoice
    const approveResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation ApproveInvoice($id: String!) {
            approveInvoice(id: $id) {
              success
              data {
                id
                status
                approvedBy
              }
            }
          }
        `,
        variables: { id: invoiceId },
      })
      .set('Authorization', `Bearer ${authToken}`);

    expect(approveResponse.body.data.approveInvoice.success).toBe(true);
    expect(approveResponse.body.data.approveInvoice.data.status).toBe('APPROVED');

    // STEP 3: Verify in database
    const invoice = await getInvoiceFromDatabase(app, invoiceId);
    expect(invoice.status).toBe('APPROVED');
    expect(invoice.approvedBy).toBeDefined();
  });

  it('should reject approval without permission', async () => {
    const unauthorizedToken = await getAuthToken(app, 'user@company.com');

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation { approveInvoice(id: "invoice-123") { success } }`,
      })
      .set('Authorization', `Bearer ${unauthorizedToken}`);

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('Forbidden');
  });
});
```

**Vextrus ERP Example**:
- File: `services/finance/test/invoice.e2e.spec.ts`
- Tests: 22 E2E tests
- Coverage: Critical user journeys

---

## Pattern 6: Bangladesh Compliance Testing

**Context**: NBR-specific tax rules

**When to Use**: All tax calculations, TIN validation, Mushak-6.3

**Example**:
```typescript
describe('Bangladesh VAT compliance', () => {
  it('should calculate 15% VAT for standard rate', () => {
    const invoice = new Invoice({
      subtotal: Money.BDT(10000),
      vatRate: 15,
    });

    invoice.calculateTax();

    expect(invoice.vat.amount).toBe(1500);
    expect(invoice.total.amount).toBe(11500);
  });

  it('should calculate supplementary duty on subtotal + VAT', () => {
    const invoice = new Invoice({
      subtotal: Money.BDT(10000),
      vatRate: 15,
      supplementaryDutyRate: 20,
    });

    invoice.calculateTax();

    expect(invoice.vat.amount).toBe(1500);  // 10000 * 0.15
    expect(invoice.supplementaryDuty.amount).toBe(2300);  // (10000 + 1500) * 0.20
    expect(invoice.total.amount).toBe(13800);  // 10000 + 1500 + 2300
  });

  it('should validate Bangladesh TIN format (9 or 12 digits)', () => {
    expect(TIN.validate('123456789')).toBe(true);  // 9 digits
    expect(TIN.validate('123456789012')).toBe(true);  // 12 digits
    expect(TIN.validate('12345')).toBe(false);  // Too short
    expect(TIN.validate('abc123456789')).toBe(false);  // Non-numeric
  });
});
```

**Vextrus ERP Compliance**:
- 20 tests for Bangladesh NBR rules
- 100% coverage on tax calculations
- 3 compliance audits passed

---

## Pattern 7: Multi-Tenant Testing

**Context**: Tenant isolation verification

**When to Use**: All features involving tenant_id

**Example**:
```typescript
describe('Invoice multi-tenancy', () => {
  it('should isolate invoices by tenant', async () => {
    const tenant1 = 'tenant-111';
    const tenant2 = 'tenant-222';

    // Create invoices for different tenants
    const invoice1 = await createInvoice({ customerId: 'customer-1', tenantId: tenant1 });
    const invoice2 = await createInvoice({ customerId: 'customer-2', tenantId: tenant2 });

    // Query as tenant 1
    const tenant1Invoices = await repository.findAll({ tenantId: tenant1 });
    expect(tenant1Invoices).toHaveLength(1);
    expect(tenant1Invoices[0].id).toBe(invoice1.id);

    // Query as tenant 2
    const tenant2Invoices = await repository.findAll({ tenantId: tenant2 });
    expect(tenant2Invoices).toHaveLength(1);
    expect(tenant2Invoices[0].id).toBe(invoice2.id);
  });

  it('should prevent cross-tenant access', async () => {
    const tenant1 = 'tenant-111';
    const tenant2 = 'tenant-222';

    const invoice = await createInvoice({ customerId: 'customer-1', tenantId: tenant1 });

    // Try to access as different tenant
    await expect(
      repository.findById(invoice.id, { tenantId: tenant2 })
    ).rejects.toThrow('Invoice not found');
  });
});
```

---

## Cross-References

**Related Patterns**:
- **execute-first-patterns.md**: When TDD overrides execute-first workflow
- **quality-gates.md**: Test coverage requirements (85%+ overall)
- **event-sourcing-patterns.md**: Event emission testing
- **multi-tenancy-patterns.md**: Tenant isolation testing

**Skill Coordination**:
- test-first activates automatically for financial features
- Modifies execute-first workflow (write test FIRST)
- See: `.claude/skills/test-first/SKILL.md`

---

## Summary

**7 Core Patterns**:
1. **Financial Calculation**: TDD for all Money operations
2. **Payment Processing**: Validation + status transitions
3. **CQRS Command**: Integration tests for command handlers
4. **Event Sourcing**: Event emission + reconstruction
5. **GraphQL E2E**: Full stack API testing
6. **Bangladesh Compliance**: NBR tax rules
7. **Multi-Tenant**: Tenant isolation verification

**Guiding Principle**: Test-first for critical features (financial, payment, tax), test-after for others

**Evidence**: 377 tests in Finance service, 0 production bugs in TDD features, 85% coverage
