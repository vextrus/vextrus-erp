import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CreateInvoiceCommand } from '../create-invoice.command';
import { IInvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { Invoice, VendorId, CustomerId } from '../../../domain/aggregates/invoice/invoice.aggregate';
import { TenantId } from '../../../domain/aggregates/chart-of-account/chart-of-account.aggregate';

/**
 * Create Invoice Command Handler
 *
 * Handles the creation of new invoices using CQRS pattern.
 * Creates an Invoice aggregate, persists it to EventStore,
 * and publishes domain events to Kafka via EventBus.
 */
@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  private readonly logger = new Logger(CreateInvoiceHandler.name);

  constructor(
    @Inject('IInvoiceRepository')
    private readonly repository: IInvoiceRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<string> {
    this.logger.log(`Creating invoice for customer: ${command.customerId}`);

    try {
      // Create the invoice aggregate using domain logic
      const invoice = Invoice.create({
        vendorId: new VendorId(command.vendorId),
        customerId: new CustomerId(command.customerId),
        invoiceDate: command.invoiceDate,
        dueDate: command.dueDate,
        tenantId: new TenantId(command.tenantId),
        lineItems: command.lineItems,
        vendorTIN: command.vendorTIN,
        vendorBIN: command.vendorBIN,
        customerTIN: command.customerTIN,
        customerBIN: command.customerBIN,
      });

      // Persist to event store (write model)
      await this.repository.save(invoice);

      // Publish domain events to Kafka for read model projection
      const events = invoice.getUncommittedEvents();
      this.logger.log(`Publishing ${events.length} domain events for invoice ${invoice.getId().value}`);

      for (const event of events) {
        this.eventBus.publish(event);
      }

      const invoiceId = invoice.getId().value;
      this.logger.log(`Invoice created successfully: ${invoiceId}`);

      return invoiceId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create invoice: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
