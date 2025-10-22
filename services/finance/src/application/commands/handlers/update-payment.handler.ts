import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { UpdatePaymentCommand } from '../update-payment.command';
import { IPaymentRepository } from '../../../domain/repositories/payment.repository.interface';
import { PaymentStatus } from '../../../domain/aggregates/payment/payment.aggregate';
import { UserId } from '../../../domain/aggregates/invoice/invoice.aggregate';
import { Money } from '../../../domain/value-objects/money.value-object';

/**
 * Update Payment Command Handler
 *
 * Handles updating existing payments (PENDING status only) using CQRS pattern.
 * Loads aggregate from EventStore, applies updates via domain methods,
 * persists new events, and publishes them to Kafka via EventBus.
 *
 * Business Rules:
 * - Only PENDING payments can be updated
 * - Cannot update after payment is PROCESSING, COMPLETED, or RECONCILED
 * - Updates are recorded as events (event sourcing)
 * - Partial updates supported (only provided fields are updated)
 *
 * Bangladesh Compliance:
 * - Mobile number validation for wallet payments
 * - Check number tracking for check payments
 */
@CommandHandler(UpdatePaymentCommand)
export class UpdatePaymentHandler implements ICommandHandler<UpdatePaymentCommand> {
  private readonly logger = new Logger(UpdatePaymentHandler.name);

  constructor(
    @Inject('IPaymentRepository')
    private readonly repository: IPaymentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdatePaymentCommand): Promise<string> {
    this.logger.log(`Updating payment ${command.paymentId}, user ${command.userId}`);

    try {
      // Load aggregate from EventStore
      const payment = await this.repository.findById(command.paymentId, command.tenantId);

      if (!payment) {
        throw new NotFoundException(`Payment ${command.paymentId} not found`);
      }

      const userId = new UserId(command.userId);

      // Apply updates via domain methods (emits events)
      // Each method validates that status is PENDING

      if (command.amount !== undefined && command.currency !== undefined) {
        this.logger.log(`Updating payment amount to ${command.amount} ${command.currency}`);
        const amount = Money.create(command.amount, command.currency);
        payment.updateAmount(amount, userId);
      }

      if (command.paymentDate) {
        this.logger.log(`Updating payment date to ${command.paymentDate}`);
        payment.updatePaymentDate(command.paymentDate, userId);
      }

      if (command.paymentMethod) {
        this.logger.log(`Updating payment method to ${command.paymentMethod}`);
        payment.updatePaymentMethod(command.paymentMethod, userId);
      }

      if (command.reference !== undefined) {
        this.logger.log(`Updating payment reference to ${command.reference}`);
        payment.updateReference(command.reference, userId);
      }

      if (command.bankAccountId || command.checkNumber) {
        this.logger.log('Updating bank details');
        payment.updateBankDetails(command.bankAccountId, command.checkNumber, userId);
      }

      // Persist updated aggregate to EventStore
      await this.repository.save(payment);

      // Publish domain events to Kafka for read model projection
      const events = payment.getUncommittedEvents();
      this.logger.log(`Publishing ${events.length} domain events for payment ${command.paymentId}`);

      for (const event of events) {
        this.eventBus.publish(event);
      }

      this.logger.log(`Payment ${command.paymentId} updated successfully`);

      return command.paymentId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to update payment ${command.paymentId}: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
