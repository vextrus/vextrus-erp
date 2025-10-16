import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { ApproveInvoiceCommand } from '../approve-invoice.command';
import { IInvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { UserId } from '../../../domain/aggregates/invoice/invoice.aggregate';

/**
 * Approve Invoice Command Handler
 *
 * Handles the approval of draft invoices.
 * Loads the aggregate from EventStore, applies business rules,
 * and persists the approval event.
 */
@CommandHandler(ApproveInvoiceCommand)
export class ApproveInvoiceHandler implements ICommandHandler<ApproveInvoiceCommand> {
  private readonly logger = new Logger(ApproveInvoiceHandler.name);

  constructor(
    @Inject('IInvoiceRepository')
    private readonly repository: IInvoiceRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ApproveInvoiceCommand): Promise<void> {
    this.logger.log(`Approving invoice: ${command.invoiceId}`);

    try {
      // Load invoice aggregate from event store
      const invoice = await this.repository.findById(command.invoiceId);

      if (!invoice) {
        throw new NotFoundException(`Invoice not found: ${command.invoiceId}`);
      }

      // Apply business logic (will throw if invalid state transition)
      invoice.approve(new UserId(command.userId));

      // Persist events to event store
      await this.repository.save(invoice);

      // Publish domain events to Kafka
      const events = invoice.getUncommittedEvents();
      this.logger.log(`Publishing ${events.length} domain events for invoice approval ${command.invoiceId}`);

      for (const event of events) {
        this.eventBus.publish(event);
      }

      this.logger.log(`Invoice approved successfully: ${command.invoiceId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to approve invoice: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
