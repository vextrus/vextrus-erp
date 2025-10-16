import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { FailPaymentCommand } from '../fail-payment.command';
import { IPaymentRepository } from '../../../domain/repositories/payment.repository.interface';

/**
 * Fail Payment Command Handler
 *
 * Handles payment failure when transaction is rejected or errors occur.
 * Records failure reason for audit trail and troubleshooting.
 *
 * Business Rules:
 * - Payment must be in PENDING or PROCESSING status
 * - Failure reason is required (min 10 characters)
 * - Failed payments can be retried or cancelled
 * - Failure triggers notification to user/system
 */
@CommandHandler(FailPaymentCommand)
export class FailPaymentHandler implements ICommandHandler<FailPaymentCommand> {
  private readonly logger = new Logger(FailPaymentHandler.name);

  constructor(
    @Inject('IPaymentRepository')
    private readonly repository: IPaymentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: FailPaymentCommand): Promise<void> {
    this.logger.log(`Failing payment ${command.paymentId}, reason: ${command.reason}`);

    try {
      // Load payment from EventStore
      const payment = await this.repository.findById(command.paymentId);
      if (!payment) {
        throw new NotFoundException(`Payment ${command.paymentId} not found`);
      }

      // Execute domain logic (validates status)
      try {
        payment.fail(command.reason);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Cannot fail payment')) {
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

      this.logger.log(`Payment failed successfully: ${command.paymentId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fail payment: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
