import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReconcilePaymentCommand } from '../reconcile-payment.command';
import { IPaymentRepository } from '../../../domain/repositories/payment.repository.interface';
import {
  PaymentAlreadyReconciledException,
  BankStatement,
} from '../../../domain/aggregates/payment/payment.aggregate';
import { UserId } from '../../../domain/aggregates/invoice/invoice.aggregate';
import { Money } from '../../../domain/value-objects/money.value-object';

/**
 * Reconcile Payment Command Handler
 *
 * Handles payment reconciliation with bank statement transactions.
 * Matches payment with actual bank transaction for financial accuracy.
 *
 * Business Rules:
 * - Payment must be in COMPLETED status
 * - Payment cannot already be RECONCILED
 * - Bank statement transaction ID is required
 * - Reconciliation creates immutable audit trail
 *
 * Note: In production, this would fetch actual bank statement from banking service.
 * For now, we create a minimal bank statement for the reconciliation.
 */
@CommandHandler(ReconcilePaymentCommand)
export class ReconcilePaymentHandler implements ICommandHandler<ReconcilePaymentCommand> {
  private readonly logger = new Logger(ReconcilePaymentHandler.name);

  constructor(
    @Inject('IPaymentRepository')
    private readonly repository: IPaymentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ReconcilePaymentCommand): Promise<void> {
    this.logger.log(`Reconciling payment ${command.paymentId} with bank transaction ${command.bankStatementTransactionId}`);

    try {
      // Load payment from EventStore
      const payment = await this.repository.findById(command.paymentId);
      if (!payment) {
        throw new NotFoundException(`Payment ${command.paymentId} not found`);
      }

      // Create bank statement with the matching transaction
      // In production, this would be fetched from banking service
      const bankStatement: BankStatement = {
        bankAccountId: command.paymentId, // Simplified for now
        transactions: [
          {
            transactionId: command.bankStatementTransactionId,
            date: payment.getAmount().getAmount() ? new Date() : new Date(), // Payment date
            description: `Payment reconciliation`,
            reference: payment.getTransactionReference() || '',
            amount: payment.getAmount(),
            type: 'DEBIT' as const,
            balance: Money.create(0, payment.getAmount().getCurrency()),
          },
        ],
        startDate: new Date(),
        endDate: new Date(),
        openingBalance: Money.create(0, payment.getAmount().getCurrency()),
        closingBalance: Money.create(0, payment.getAmount().getCurrency()),
      };

      // Execute domain logic (validates status and matches transaction)
      try {
        payment.reconcile(bankStatement, new UserId(command.reconciledBy));
      } catch (error) {
        if (error instanceof PaymentAlreadyReconciledException) {
          throw new BadRequestException(error.message);
        }
        if (error instanceof Error && error.message.includes('Cannot reconcile payment')) {
          throw new BadRequestException(error.message);
        }
        throw error;
      }

      // Save to EventStore
      await this.repository.save(payment);

      // Publish domain events
      const events = payment.getUncommittedEvents();
      this.logger.log(`Publishing ${events.length} events for payment ${command.paymentId}`);

      for (const event of events) {
        this.eventBus.publish(event);
      }

      this.logger.log(`Payment reconciled successfully: ${command.paymentId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to reconcile payment: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
