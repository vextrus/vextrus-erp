import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infrastructure
import { AuthModule } from '../../infrastructure/auth/auth.module';

// Resolvers
import { InvoiceResolver } from './resolvers/invoice.resolver';
import { ChartOfAccountResolver } from './resolvers/chart-of-account.resolver';
import { PaymentResolver } from './resolvers/payment.resolver';
import { JournalEntryResolver } from './resolvers/journal-entry.resolver';

// Command Handlers - Invoice
import { CreateInvoiceHandler } from '../../application/commands/handlers/create-invoice.handler';
import { ApproveInvoiceHandler } from '../../application/commands/handlers/approve-invoice.handler';
import { CancelInvoiceHandler } from '../../application/commands/handlers/cancel-invoice.handler';

// Command Handlers - Chart of Account
import { CreateAccountHandler } from '../../application/commands/handlers/create-account.handler';
import { DeactivateAccountHandler } from '../../application/commands/handlers/deactivate-account.handler';

// Command Handlers - Payment
import { CreatePaymentHandler } from '../../application/commands/handlers/create-payment.handler';
import { CompletePaymentHandler } from '../../application/commands/handlers/complete-payment.handler';
import { FailPaymentHandler } from '../../application/commands/handlers/fail-payment.handler';
import { ReconcilePaymentHandler } from '../../application/commands/handlers/reconcile-payment.handler';
import { ReversePaymentHandler } from '../../application/commands/handlers/reverse-payment.handler';

// Command Handlers - Journal Entry
import { CreateJournalHandler } from '../../application/commands/handlers/create-journal.handler';
import { AddJournalLineHandler } from '../../application/commands/handlers/add-journal-line.handler';
import { PostJournalHandler } from '../../application/commands/handlers/post-journal.handler';
import { ReverseJournalHandler } from '../../application/commands/handlers/reverse-journal.handler';

// Query Handlers - Invoice
import { GetInvoiceHandler } from '../../application/queries/handlers/get-invoice.handler';
import { GetInvoicesHandler } from '../../application/queries/handlers/get-invoices.handler';

// Query Handlers - Chart of Account
import { GetAccountHandler } from '../../application/queries/handlers/get-account.handler';
import { GetAccountsHandler } from '../../application/queries/handlers/get-accounts.handler';
import { GetAccountByCodeHandler } from '../../application/queries/handlers/get-account-by-code.handler';

// Query Handlers - Payment
import { GetPaymentHandler } from '../../application/queries/handlers/get-payment.handler';
import { GetPaymentsHandler } from '../../application/queries/handlers/get-payments.handler';
import { GetPaymentsByInvoiceHandler } from '../../application/queries/handlers/get-payments-by-invoice.handler';
import { GetPaymentsByStatusHandler } from '../../application/queries/handlers/get-payments-by-status.handler';

// Query Handlers - Journal Entry
import { GetJournalHandler } from '../../application/queries/handlers/get-journal.handler';
import { GetJournalsHandler } from '../../application/queries/handlers/get-journals.handler';
import { GetJournalsByPeriodHandler } from '../../application/queries/handlers/get-journals-by-period.handler';
import { GetUnpostedJournalsHandler } from '../../application/queries/handlers/get-unposted-journals.handler';

// Event Handlers
import { INVOICE_EVENT_HANDLERS } from '../../infrastructure/event-handlers';
import { AccountProjectionHandler } from '../../application/queries/handlers/account-projection.handler';
import { PaymentProjectionHandler } from '../../application/queries/handlers/payment-projection.handler';
import { JournalProjectionHandler } from '../../application/queries/handlers/journal-projection.handler';

// Repositories
import { InvoiceEventStoreRepository } from '../../infrastructure/persistence/event-store/invoice-event-store.repository';
import { ChartOfAccountEventStoreRepository } from '../../infrastructure/persistence/event-store/chart-of-account-event-store.repository';
import { PaymentEventStoreRepository } from '../../infrastructure/persistence/event-store/payment-event-store.repository';
import { JournalEntryEventStoreRepository } from '../../infrastructure/persistence/event-store/journal-entry-event-store.repository';

// TypeORM Entities
import { InvoiceReadModel } from '../../infrastructure/persistence/typeorm/entities/invoice.entity';
import { ChartOfAccountReadModel } from '../../infrastructure/persistence/typeorm/entities/chart-of-account.entity';
import { PaymentReadModel } from '../../infrastructure/persistence/typeorm/entities/payment.entity';
import { JournalEntryReadModel } from '../../infrastructure/persistence/typeorm/entities/journal-entry.entity';

// Infrastructure
import { TenantContextService } from '../../infrastructure/context/tenant-context.service';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([InvoiceReadModel, ChartOfAccountReadModel, PaymentReadModel, JournalEntryReadModel]),
    AuthModule,
  ],
  providers: [
    // Resolvers
    InvoiceResolver,
    ChartOfAccountResolver,
    PaymentResolver,
    JournalEntryResolver,

    // Command Handlers - Invoice
    CreateInvoiceHandler,
    ApproveInvoiceHandler,
    CancelInvoiceHandler,

    // Command Handlers - Chart of Account
    CreateAccountHandler,
    DeactivateAccountHandler,

    // Command Handlers - Payment
    CreatePaymentHandler,
    CompletePaymentHandler,
    FailPaymentHandler,
    ReconcilePaymentHandler,
    ReversePaymentHandler,

    // Command Handlers - Journal Entry
    CreateJournalHandler,
    AddJournalLineHandler,
    PostJournalHandler,
    ReverseJournalHandler,

    // Query Handlers - Invoice
    GetInvoiceHandler,
    GetInvoicesHandler,

    // Query Handlers - Chart of Account
    GetAccountHandler,
    GetAccountsHandler,
    GetAccountByCodeHandler,

    // Query Handlers - Payment
    GetPaymentHandler,
    GetPaymentsHandler,
    GetPaymentsByInvoiceHandler,
    GetPaymentsByStatusHandler,

    // Query Handlers - Journal Entry
    GetJournalHandler,
    GetJournalsHandler,
    GetJournalsByPeriodHandler,
    GetUnpostedJournalsHandler,

    // Event Handlers
    ...INVOICE_EVENT_HANDLERS,
    AccountProjectionHandler,
    PaymentProjectionHandler,
    JournalProjectionHandler,

    // Repositories
    {
      provide: 'IInvoiceRepository',
      useClass: InvoiceEventStoreRepository,
    },
    {
      provide: 'IChartOfAccountRepository',
      useClass: ChartOfAccountEventStoreRepository,
    },
    {
      provide: 'IPaymentRepository',
      useClass: PaymentEventStoreRepository,
    },
    {
      provide: 'IJournalEntryRepository',
      useClass: JournalEntryEventStoreRepository,
    },

    // Context
    TenantContextService,
  ],
  exports: [
    InvoiceResolver,
    ChartOfAccountResolver,
    PaymentResolver,
    JournalEntryResolver,
  ],
})
export class FinanceGraphQLModule {}
