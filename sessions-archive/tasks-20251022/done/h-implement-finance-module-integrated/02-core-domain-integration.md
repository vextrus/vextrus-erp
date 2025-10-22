---
task: h-implement-finance-module-integrated/02-core-domain-integration
branch: feature/finance-module-integrated
status: pending
created: 2025-09-29
modules: [finance, master-data, auth, workflow, notification]
phase: 2
duration: Week 3-4
---

# Phase 2: Core Domain & Integration

## Objective
Implement core financial domain models with DDD principles, integrate with Master Data service for entity resolution, connect to Workflow Engine for approvals, and establish CQRS query models.

## Success Criteria
- [ ] Chart of Accounts aggregate with hierarchical structure
- [ ] Invoice aggregate with line items and VAT calculations
- [ ] Payment processing aggregate with reconciliation
- [ ] Journal Entry system with double-entry validation
- [ ] Master Data service integration for vendors/customers
- [ ] Auth service JWT validation and RBAC
- [ ] Workflow engine integration for approvals
- [ ] CQRS query models with projections

## Domain Implementation

### 1. Chart of Accounts Aggregate
```typescript
// domain/aggregates/chart-of-account/chart-of-account.aggregate.ts
export class ChartOfAccount extends AggregateRoot {
  private accountId: AccountId;
  private accountCode: AccountCode;
  private accountName: string;
  private accountType: AccountType;
  private parentAccountId?: AccountId;
  private balance: Money;
  private currency: Currency;
  private isActive: boolean;
  private tenantId: TenantId;

  // Factory method
  static create(
    command: CreateAccountCommand
  ): ChartOfAccount {
    const account = new ChartOfAccount();

    // Validate business rules
    if (!this.isValidAccountCode(command.accountCode)) {
      throw new InvalidAccountCodeException();
    }

    // Apply event
    account.apply(new AccountCreatedEvent({
      accountId: AccountId.generate(),
      accountCode: command.accountCode,
      accountName: command.accountName,
      accountType: command.accountType,
      parentAccountId: command.parentAccountId,
      currency: command.currency,
      tenantId: command.tenantId,
    }));

    return account;
  }

  // Business methods
  updateBalance(amount: Money): void {
    if (!amount.isSameCurrency(this.currency)) {
      throw new CurrencyMismatchException();
    }

    this.apply(new AccountBalanceUpdatedEvent({
      accountId: this.accountId,
      previousBalance: this.balance,
      newBalance: this.balance.add(amount),
      timestamp: new Date(),
    }));
  }

  // Event handlers
  private onAccountCreated(event: AccountCreatedEvent): void {
    this.accountId = event.accountId;
    this.accountCode = event.accountCode;
    this.accountName = event.accountName;
    this.accountType = event.accountType;
    this.balance = Money.zero(event.currency);
    this.currency = event.currency;
    this.isActive = true;
  }
}
```

### 2. Invoice Aggregate with Bangladesh VAT
```typescript
// domain/aggregates/invoice/invoice.aggregate.ts
export class Invoice extends AggregateRoot {
  private invoiceId: InvoiceId;
  private invoiceNumber: string;
  private vendorId: VendorId;
  private customerId: CustomerId;
  private lineItems: LineItem[] = [];
  private subtotal: Money;
  private vatAmount: Money;
  private aitAmount: Money;
  private grandTotal: Money;
  private status: InvoiceStatus;
  private mushakNumber?: string;
  private challanNumber?: string;

  static create(command: CreateInvoiceCommand): Invoice {
    const invoice = new Invoice();

    // Generate Mushak-compliant invoice number
    const invoiceNumber = this.generateMushakInvoiceNumber(
      command.invoiceDate,
      command.tenantId
    );

    invoice.apply(new InvoiceCreatedEvent({
      invoiceId: InvoiceId.generate(),
      invoiceNumber,
      vendorId: command.vendorId,
      customerId: command.customerId,
      invoiceDate: command.invoiceDate,
      dueDate: command.dueDate,
      tenantId: command.tenantId,
    }));

    // Add line items
    command.lineItems.forEach(item => {
      invoice.addLineItem(item);
    });

    return invoice;
  }

  addLineItem(item: LineItemDto): void {
    // Validate VAT rate for Bangladesh
    const vatRate = this.getVATRate(item.productType);
    const vatAmount = item.amount.multiply(vatRate);

    this.apply(new LineItemAddedEvent({
      invoiceId: this.invoiceId,
      lineItem: {
        id: LineItemId.generate(),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        vatRate,
        vatAmount,
        hsCode: item.hsCode, // Bangladesh HS Code
      }
    }));
  }

  private getVATRate(productType: string): number {
    // Bangladesh VAT rates
    const vatRates = {
      'standard': 0.15,      // 15% standard rate
      'reduced': 0.075,      // 7.5% reduced rate
      'zero': 0,             // 0% zero-rated
      'exempt': 0,           // Exempt items
    };

    return vatRates[productType] || 0.15;
  }

  approve(approvedBy: UserId): void {
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new InvalidInvoiceStatusException();
    }

    this.apply(new InvoiceApprovedEvent({
      invoiceId: this.invoiceId,
      approvedBy,
      approvedAt: new Date(),
      mushakNumber: this.generateMushakNumber(),
    }));
  }

  private generateMushakNumber(): string {
    // Format: MUSHAK-6.3-YYYY-MM-NNNNNN
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const sequence = this.getNextMushakSequence();

    return `MUSHAK-6.3-${year}-${month}-${sequence}`;
  }
}
```

### 3. Payment Processing Aggregate
```typescript
// domain/aggregates/payment/payment.aggregate.ts
export class Payment extends AggregateRoot {
  private paymentId: PaymentId;
  private paymentNumber: string;
  private invoiceId: InvoiceId;
  private amount: Money;
  private paymentMethod: PaymentMethod;
  private bankAccount?: BankAccountId;
  private mobileWallet?: MobileWallet;
  private status: PaymentStatus;
  private reconciledAt?: Date;

  static create(command: CreatePaymentCommand): Payment {
    const payment = new Payment();

    // Validate payment method for Bangladesh
    if (!this.isValidPaymentMethod(command.paymentMethod)) {
      throw new InvalidPaymentMethodException();
    }

    payment.apply(new PaymentCreatedEvent({
      paymentId: PaymentId.generate(),
      paymentNumber: this.generatePaymentNumber(),
      invoiceId: command.invoiceId,
      amount: command.amount,
      paymentMethod: command.paymentMethod,
      paymentDate: command.paymentDate,
      reference: command.reference,
    }));

    // Handle mobile wallet payments
    if (this.isMobileWallet(command.paymentMethod)) {
      payment.processMobileWalletPayment(command);
    }

    return payment;
  }

  private processMobileWalletPayment(command: CreatePaymentCommand): void {
    this.apply(new MobileWalletPaymentInitiatedEvent({
      paymentId: this.paymentId,
      provider: command.walletProvider, // bKash, Nagad, Rocket
      mobileNumber: command.mobileNumber,
      transactionId: command.walletTransactionId,
    }));
  }

  reconcile(bankStatement: BankStatement): void {
    if (this.status !== PaymentStatus.PENDING) {
      throw new PaymentAlreadyReconciledException();
    }

    // Match payment with bank statement
    const match = this.findMatchingTransaction(bankStatement);

    if (!match) {
      throw new NoMatchingTransactionException();
    }

    this.apply(new PaymentReconciledEvent({
      paymentId: this.paymentId,
      bankTransactionId: match.transactionId,
      reconciledAt: new Date(),
      reconciledBy: command.userId,
    }));
  }
}
```

### 4. Journal Entry System
```typescript
// domain/aggregates/journal/journal-entry.aggregate.ts
export class JournalEntry extends AggregateRoot {
  private journalId: JournalId;
  private journalNumber: string;
  private journalDate: Date;
  private description: string;
  private entries: JournalLine[] = [];
  private totalDebit: Money;
  private totalCredit: Money;
  private status: JournalStatus;
  private isReversing: boolean;
  private reversingDate?: Date;

  static create(command: CreateJournalCommand): JournalEntry {
    const journal = new JournalEntry();

    journal.apply(new JournalCreatedEvent({
      journalId: JournalId.generate(),
      journalNumber: this.generateJournalNumber(),
      journalDate: command.journalDate,
      description: command.description,
      reference: command.reference,
      tenantId: command.tenantId,
    }));

    // Add journal lines
    command.lines.forEach(line => {
      journal.addJournalLine(line);
    });

    // Validate double-entry bookkeeping
    journal.validateBalance();

    return journal;
  }

  addJournalLine(line: JournalLineDto): void {
    this.apply(new JournalLineAddedEvent({
      journalId: this.journalId,
      line: {
        lineId: JournalLineId.generate(),
        accountId: line.accountId,
        debitAmount: line.debitAmount || Money.zero(),
        creditAmount: line.creditAmount || Money.zero(),
        description: line.description,
        costCenter: line.costCenter,
        project: line.project,
      }
    }));
  }

  private validateBalance(): void {
    const totalDebit = this.entries.reduce(
      (sum, entry) => sum.add(entry.debitAmount),
      Money.zero()
    );

    const totalCredit = this.entries.reduce(
      (sum, entry) => sum.add(entry.creditAmount),
      Money.zero()
    );

    if (!totalDebit.equals(totalCredit)) {
      throw new UnbalancedJournalException(totalDebit, totalCredit);
    }
  }

  post(): void {
    if (this.status !== JournalStatus.DRAFT) {
      throw new InvalidJournalStatusException();
    }

    this.validateBalance();

    this.apply(new JournalPostedEvent({
      journalId: this.journalId,
      postedAt: new Date(),
      postedBy: command.userId,
    }));
  }

  createReversingEntry(reversingDate: Date): JournalEntry {
    if (this.status !== JournalStatus.POSTED) {
      throw new CannotReverseUnpostedJournalException();
    }

    const reversingJournal = new JournalEntry();

    // Reverse all entries
    const reversedLines = this.entries.map(line => ({
      accountId: line.accountId,
      debitAmount: line.creditAmount, // Swap debit/credit
      creditAmount: line.debitAmount,
      description: `Reversing: ${line.description}`,
    }));

    reversingJournal.apply(new ReversingJournalCreatedEvent({
      originalJournalId: this.journalId,
      reversingJournalId: JournalId.generate(),
      reversingDate,
      lines: reversedLines,
    }));

    return reversingJournal;
  }
}
```

## Service Integrations

### 5. Master Data Service Integration
```typescript
// infrastructure/integrations/master-data.client.ts
@Injectable()
export class MasterDataClient {
  constructor(
    private httpService: HttpService,
    @Inject('APOLLO_CLIENT') private apolloClient: ApolloClient<any>
  ) {}

  async getVendor(vendorId: string): Promise<Vendor> {
    const query = gql`
      query GetVendor($id: String!) {
        vendor(id: $id) {
          id
          name
          tin
          bin
          address
          contact
          bankAccounts {
            accountNumber
            bankName
            branch
          }
        }
      }
    `;

    const result = await this.apolloClient.query({
      query,
      variables: { id: vendorId },
    });

    return result.data.vendor;
  }

  async validateTIN(tin: string): Promise<boolean> {
    const mutation = gql`
      mutation ValidateTIN($tin: String!) {
        validateTIN(tin: $tin) {
          isValid
          details {
            name
            address
            status
          }
        }
      }
    `;

    const result = await this.apolloClient.mutate({
      mutation,
      variables: { tin },
    });

    return result.data.validateTIN.isValid;
  }
}
```

### 6. Workflow Engine Integration
```typescript
// infrastructure/integrations/workflow.client.ts
import { WorkflowClient } from '@temporalio/client';

@Injectable()
export class WorkflowEngineClient {
  private client: WorkflowClient;

  constructor(configService: ConfigService) {
    this.client = new WorkflowClient({
      address: configService.get('TEMPORAL_ADDRESS'),
      namespace: configService.get('TEMPORAL_NAMESPACE'),
    });
  }

  async startInvoiceApproval(
    invoiceId: string,
    amount: number
  ): Promise<string> {
    const handle = await this.client.start('invoice-approval-workflow', {
      taskQueue: 'finance-approval',
      args: [{
        invoiceId,
        amount,
        approvalLevels: this.getApprovalLevels(amount),
      }],
      workflowId: `invoice-approval-${invoiceId}`,
    });

    return handle.workflowId;
  }

  private getApprovalLevels(amount: number): ApprovalLevel[] {
    // Define approval matrix based on amount
    if (amount < 10000) {
      return [{ role: 'SUPERVISOR', threshold: amount }];
    } else if (amount < 50000) {
      return [
        { role: 'SUPERVISOR', threshold: 10000 },
        { role: 'MANAGER', threshold: amount },
      ];
    } else {
      return [
        { role: 'SUPERVISOR', threshold: 10000 },
        { role: 'MANAGER', threshold: 50000 },
        { role: 'DIRECTOR', threshold: amount },
      ];
    }
  }

  async getApprovalStatus(workflowId: string): Promise<ApprovalStatus> {
    const handle = this.client.getHandle(workflowId);
    return await handle.query('getStatus');
  }
}
```

### 7. CQRS Query Models
```typescript
// application/queries/invoice-projection.handler.ts
@EventsHandler(InvoiceCreatedEvent, InvoiceUpdatedEvent, InvoiceApprovedEvent)
export class InvoiceProjectionHandler implements IEventHandler {
  constructor(
    @InjectRepository(InvoiceProjection)
    private projectionRepository: Repository<InvoiceProjection>,
  ) {}

  async handle(event: InvoiceEvent): Promise<void> {
    switch (event.constructor) {
      case InvoiceCreatedEvent:
        await this.handleInvoiceCreated(event as InvoiceCreatedEvent);
        break;
      case InvoiceUpdatedEvent:
        await this.handleInvoiceUpdated(event as InvoiceUpdatedEvent);
        break;
      case InvoiceApprovedEvent:
        await this.handleInvoiceApproved(event as InvoiceApprovedEvent);
        break;
    }
  }

  private async handleInvoiceCreated(event: InvoiceCreatedEvent): Promise<void> {
    const projection = new InvoiceProjection();
    projection.id = event.invoiceId;
    projection.invoiceNumber = event.invoiceNumber;
    projection.vendorId = event.vendorId;
    projection.customerId = event.customerId;
    projection.status = 'DRAFT';
    projection.createdAt = event.timestamp;

    // Denormalize vendor data
    const vendor = await this.masterDataClient.getVendor(event.vendorId);
    projection.vendorName = vendor.name;
    projection.vendorTin = vendor.tin;

    await this.projectionRepository.save(projection);
  }
}

// application/queries/invoice.query.ts
export class GetInvoicesQuery {
  constructor(
    public readonly filters?: {
      status?: InvoiceStatus;
      vendorId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    public readonly pagination?: {
      page: number;
      limit: number;
    },
  ) {}
}

@QueryHandler(GetInvoicesQuery)
export class GetInvoicesHandler implements IQueryHandler<GetInvoicesQuery> {
  constructor(
    @InjectRepository(InvoiceProjection)
    private projectionRepository: Repository<InvoiceProjection>,
  ) {}

  async execute(query: GetInvoicesQuery): Promise<InvoiceProjection[]> {
    const queryBuilder = this.projectionRepository
      .createQueryBuilder('invoice')
      .where('invoice.tenantId = :tenantId', {
        tenantId: cls.get('tenantId')
      });

    if (query.filters?.status) {
      queryBuilder.andWhere('invoice.status = :status', {
        status: query.filters.status
      });
    }

    if (query.filters?.vendorId) {
      queryBuilder.andWhere('invoice.vendorId = :vendorId', {
        vendorId: query.filters.vendorId
      });
    }

    if (query.pagination) {
      queryBuilder
        .skip((query.pagination.page - 1) * query.pagination.limit)
        .take(query.pagination.limit);
    }

    return queryBuilder.getMany();
  }
}
```

## GraphQL Schema

### 8. Federation Schema
```graphql
extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.0",
        import: ["@key", "@shareable", "@external", "@requires", "@provides"])

type Invoice @key(fields: "id") {
  id: ID!
  invoiceNumber: String!
  vendorId: String! @external
  vendor: Vendor @requires(fields: "vendorId")
  customerId: String! @external
  customer: Customer @requires(fields: "customerId")
  lineItems: [LineItem!]!
  subtotal: Money!
  vatAmount: Money!
  grandTotal: Money!
  status: InvoiceStatus!
  mushakNumber: String
  approvalWorkflow: ApprovalWorkflow
}

type Vendor @key(fields: "id", resolvable: false) {
  id: String!
}

type Customer @key(fields: "id", resolvable: false) {
  id: String!
}

type Money {
  amount: Float!
  currency: String!
  formattedAmount: String!
}

enum InvoiceStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  PAID
  CANCELLED
}

type Query {
  invoice(id: ID!): Invoice
  invoices(
    filter: InvoiceFilter
    pagination: PaginationInput
  ): InvoiceConnection!

  chartOfAccounts: [ChartOfAccount!]!
  journalEntries(
    dateFrom: DateTime
    dateTo: DateTime
  ): [JournalEntry!]!
}

type Mutation {
  createInvoice(input: CreateInvoiceInput!): Invoice!
  approveInvoice(id: ID!): Invoice!
  createPayment(input: CreatePaymentInput!): Payment!
  createJournalEntry(input: CreateJournalInput!): JournalEntry!
}
```

## Testing Suite

### Unit Tests
```typescript
describe('Invoice Aggregate', () => {
  it('should calculate VAT correctly for Bangladesh', () => {
    const invoice = Invoice.create({
      vendorId: 'vendor-1',
      customerId: 'customer-1',
      lineItems: [
        { description: 'Service', amount: Money.of(10000, 'BDT'), productType: 'standard' }
      ]
    });

    expect(invoice.getVatAmount()).toEqual(Money.of(1500, 'BDT')); // 15% VAT
  });

  it('should generate Mushak-compliant invoice number', () => {
    const invoice = Invoice.create({...});
    expect(invoice.getInvoiceNumber()).toMatch(/^MUSHAK-6\.3-\d{4}-\d{2}-\d{6}$/);
  });
});

describe('Journal Entry', () => {
  it('should validate double-entry bookkeeping', () => {
    const journal = JournalEntry.create({
      lines: [
        { accountId: '1000', debitAmount: Money.of(1000, 'BDT'), creditAmount: Money.zero() },
        { accountId: '2000', debitAmount: Money.zero(), creditAmount: Money.of(1000, 'BDT') }
      ]
    });

    expect(() => journal.validateBalance()).not.toThrow();
  });

  it('should throw error for unbalanced entries', () => {
    expect(() => {
      JournalEntry.create({
        lines: [
          { accountId: '1000', debitAmount: Money.of(1000, 'BDT'), creditAmount: Money.zero() },
          { accountId: '2000', debitAmount: Money.zero(), creditAmount: Money.of(900, 'BDT') }
        ]
      });
    }).toThrow(UnbalancedJournalException);
  });
});
```

## Validation Checklist

- [ ] All aggregates follow DDD principles
- [ ] Event sourcing implemented correctly
- [ ] Master Data integration working
- [ ] Workflow engine connected
- [ ] CQRS projections updating
- [ ] GraphQL federation resolving entities
- [ ] Bangladesh VAT calculations accurate
- [ ] Mushak number generation working
- [ ] Double-entry validation enforced
- [ ] All unit tests passing
- [ ] Integration tests with services passing

## Next Phase Dependencies

This phase enables:
- Advanced AI/ML features (Phase 3)
- Smart reconciliation (Phase 3)
- Predictive analytics (Phase 3)
- Bangladesh compliance (Phase 4)