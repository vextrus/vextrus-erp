import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { UpdateInvoiceCommand } from '../update-invoice.command';
import { IInvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import {
  VendorId,
  CustomerId,
  UserId,
  InvoiceStatus,
} from '../../../domain/aggregates/invoice/invoice.aggregate';

/**
 * Update Invoice Command Handler
 *
 * Handles updating existing invoices (DRAFT status only) using CQRS pattern.
 * Loads aggregate from EventStore, applies updates via domain methods,
 * persists new events, and publishes them to Kafka via EventBus.
 *
 * Business Rules:
 * - Only DRAFT invoices can be updated
 * - Updates are recorded as events (event sourcing)
 * - Partial updates supported (only provided fields are updated)
 * - VAT/totals are automatically recalculated if line items change
 */
@CommandHandler(UpdateInvoiceCommand)
export class UpdateInvoiceHandler implements ICommandHandler<UpdateInvoiceCommand> {
  private readonly logger = new Logger(UpdateInvoiceHandler.name);

  constructor(
    @Inject('IInvoiceRepository')
    private readonly repository: IInvoiceRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateInvoiceCommand): Promise<string> {
    this.logger.log(`Updating invoice ${command.invoiceId}, user ${command.userId}`);

    try {
      // Load aggregate from EventStore
      const invoice = await this.repository.findById(command.invoiceId, command.tenantId);

      if (!invoice) {
        throw new NotFoundException(`Invoice ${command.invoiceId} not found`);
      }

      const userId = new UserId(command.userId);

      // Apply updates via domain methods (emits events)
      // Each method validates that status is DRAFT

      if (command.lineItems) {
        this.logger.log(`Updating line items (${command.lineItems.length} items)`);
        invoice.updateLineItems(command.lineItems, userId);
      }

      if (command.invoiceDate || command.dueDate) {
        this.logger.log('Updating invoice/due dates');
        invoice.updateDates(command.invoiceDate, command.dueDate, userId);
      }

      if (command.customerId) {
        this.logger.log(`Updating customer to ${command.customerId}`);
        invoice.updateCustomer(new CustomerId(command.customerId), userId);
      }

      if (command.vendorId) {
        this.logger.log(`Updating vendor to ${command.vendorId}`);
        invoice.updateVendor(new VendorId(command.vendorId), userId);
      }

      if (command.vendorTIN || command.vendorBIN || command.customerTIN || command.customerBIN) {
        this.logger.log('Updating tax information (TIN/BIN)');
        invoice.updateTaxInfo(
          command.vendorTIN,
          command.vendorBIN,
          command.customerTIN,
          command.customerBIN,
          userId
        );
      }

      // Persist updated aggregate to EventStore
      await this.repository.save(invoice);

      // Publish domain events to Kafka for read model projection
      const events = invoice.getUncommittedEvents();
      this.logger.log(`Publishing ${events.length} domain events for invoice ${command.invoiceId}`);

      for (const event of events) {
        this.eventBus.publish(event);
      }

      this.logger.log(`Invoice ${command.invoiceId} updated successfully`);

      return command.invoiceId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to update invoice ${command.invoiceId}: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
