import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { CancelInvoiceCommand } from '../cancel-invoice.command';
import { IInvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { UserId } from '../../../domain/aggregates/invoice/invoice.aggregate';

/**
 * Cancel Invoice Command Handler
 *
 * Handles the cancellation of invoices.
 * Loads the aggregate from EventStore, validates business rules,
 * and persists the cancellation event with reason for audit trail.
 */
@CommandHandler(CancelInvoiceCommand)
export class CancelInvoiceHandler implements ICommandHandler<CancelInvoiceCommand> {
  private readonly logger = new Logger(CancelInvoiceHandler.name);

  constructor(
    @Inject('IInvoiceRepository')
    private readonly repository: IInvoiceRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CancelInvoiceCommand): Promise<void> {
    this.logger.log(`Cancelling invoice: ${command.invoiceId}, reason: ${command.reason}`);

    try {
      // Load invoice aggregate from event store
      const invoice = await this.repository.findById(command.invoiceId);

      if (!invoice) {
        throw new NotFoundException(`Invoice not found: ${command.invoiceId}`);
      }

      // Apply business logic (will throw if paid invoice)
      invoice.cancel(new UserId(command.userId), command.reason);

      // Persist events to event store
      await this.repository.save(invoice);

      // Publish domain events to Kafka
      const events = invoice.getUncommittedEvents();
      this.logger.log(`Publishing ${events.length} domain events for invoice cancellation ${command.invoiceId}`);

      for (const event of events) {
        this.eventBus.publish(event);
      }

      this.logger.log(`Invoice cancelled successfully: ${command.invoiceId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to cancel invoice: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
