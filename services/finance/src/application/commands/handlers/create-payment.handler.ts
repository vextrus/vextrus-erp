import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CreatePaymentCommand } from '../create-payment.command';
import { IPaymentRepository } from '../../../domain/repositories/payment.repository.interface';
import { Payment, BankAccountId } from '../../../domain/aggregates/payment/payment.aggregate';
import { InvoiceId } from '../../../domain/aggregates/invoice/invoice.aggregate';
import { TenantId } from '../../../domain/aggregates/chart-of-account/chart-of-account.aggregate';
import { Money } from '../../../domain/value-objects/money.value-object';

/**
 * Create Payment Command Handler
 *
 * Handles the creation of new payments using CQRS pattern.
 * Creates a Payment aggregate, persists it to EventStore,
 * and publishes domain events to Kafka via EventBus.
 *
 * Business Rules:
 * - Amount must be positive
 * - Payment method validation (mobile wallet, bank transfer, check)
 * - Bangladesh mobile number validation for mobile wallet payments
 * - Bank account ID required for bank transfers
 * - Check number required for check payments
 */
@CommandHandler(CreatePaymentCommand)
export class CreatePaymentHandler implements ICommandHandler<CreatePaymentCommand> {
  private readonly logger = new Logger(CreatePaymentHandler.name);

  constructor(
    @Inject('IPaymentRepository')
    private readonly repository: IPaymentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreatePaymentCommand): Promise<string> {
    this.logger.log(`Creating payment for invoice ${command.invoiceId}`);

    try {
      // Create Payment aggregate
      const payment = Payment.create({
        invoiceId: new InvoiceId(command.invoiceId),
        amount: Money.create(command.amount, command.currency),
        paymentMethod: command.paymentMethod,
        paymentDate: command.paymentDate,
        reference: command.reference,
        tenantId: new TenantId(command.tenantId),
        // Optional bank payment fields
        bankAccountId: command.bankAccountId ? new BankAccountId(command.bankAccountId) : undefined,
        checkNumber: command.checkNumber,
        // Optional mobile wallet fields
        walletProvider: command.walletProvider,
        mobileNumber: command.mobileNumber,
        walletTransactionId: command.walletTransactionId,
        merchantCode: command.merchantCode,
      });

      // Save to EventStore
      await this.repository.save(payment);

      // Publish domain events
      const events = payment.getUncommittedEvents();
      this.logger.log(`Publishing ${events.length} events for payment ${payment.getId().value}`);

      for (const event of events) {
        this.eventBus.publish(event);
      }

      const paymentId = payment.getId().value;
      this.logger.log(`Payment created successfully: ${paymentId}`);

      return paymentId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create payment: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
