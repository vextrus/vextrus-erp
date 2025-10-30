import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReversePaymentCommand } from '../reverse-payment.command';
import { IPaymentRepository } from '../../../domain/repositories/payment.repository.interface';
import { UserId } from '../../../domain/aggregates/invoice/invoice.aggregate';

/**
 * Reverse Payment Command Handler
 *
 * Handles payment reversal for refunds, chargebacks, or error corrections.
 * Creates compensating transaction for audit trail.
 *
 * Business Rules:
 * - Payment must be in COMPLETED or RECONCILED status
 * - Reversal reason is required (min 10 characters)
 * - Reversal creates compensating transaction
 * - Reversed payments update invoice balance
 * - User ID logged for accountability
 */
@CommandHandler(ReversePaymentCommand)
export class ReversePaymentHandler implements ICommandHandler<ReversePaymentCommand> {
  private readonly logger = new Logger(ReversePaymentHandler.name);

  constructor(
    @Inject('IPaymentRepository')
    private readonly repository: IPaymentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ReversePaymentCommand): Promise<void> {
    this.logger.log(`Reversing payment ${command.paymentId}, reason: ${command.reason}`);

    try {
      // Load payment from EventStore
      const payment = await this.repository.findById(command.paymentId);
      if (!payment) {
        throw new NotFoundException(`Payment ${command.paymentId} not found`);
      }

      // Execute domain logic (validates status)
      try {
        payment.reverse(new UserId(command.reversedBy), command.reason);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Cannot reverse payment')) {
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

      this.logger.log(`Payment reversed successfully: ${command.paymentId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to reverse payment: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
