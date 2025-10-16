import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { CompletePaymentCommand } from '../complete-payment.command';
import { IPaymentRepository } from '../../../domain/repositories/payment.repository.interface';
import { PaymentAlreadyCompletedException } from '../../../domain/aggregates/payment/payment.aggregate';

/**
 * Complete Payment Command Handler
 *
 * Handles payment completion when transaction is successful.
 * Loads payment from EventStore, executes business logic, saves events.
 *
 * Business Rules:
 * - Payment must be in PENDING or PROCESSING status
 * - Transaction reference is required
 * - Once completed, payment can be reconciled or reversed
 * - Completion triggers invoice payment tracking
 */
@CommandHandler(CompletePaymentCommand)
export class CompletePaymentHandler implements ICommandHandler<CompletePaymentCommand> {
  private readonly logger = new Logger(CompletePaymentHandler.name);

  constructor(
    @Inject('IPaymentRepository')
    private readonly repository: IPaymentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CompletePaymentCommand): Promise<void> {
    this.logger.log(`Completing payment ${command.paymentId}`);

    try {
      // Load payment from EventStore
      const payment = await this.repository.findById(command.paymentId);
      if (!payment) {
        throw new NotFoundException(`Payment ${command.paymentId} not found`);
      }

      // Execute domain logic (validates status)
      try {
        payment.complete(command.transactionReference);
      } catch (error) {
        if (error instanceof PaymentAlreadyCompletedException) {
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

      this.logger.log(`Payment completed successfully: ${command.paymentId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to complete payment: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
