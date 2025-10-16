import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { InvoiceCreatedEvent, InvoiceStatus } from '../../domain/aggregates/invoice/invoice.aggregate';
import { InvoiceReadModel } from '../persistence/typeorm/entities/invoice.entity';

/**
 * InvoiceCreated Event Handler
 *
 * Handles InvoiceCreatedEvent to project the invoice to the PostgreSQL read model.
 * This handler is part of the CQRS read model projection pipeline.
 *
 * Data Flow:
 * 1. Command creates Invoice aggregate → InvoiceCreatedEvent emitted
 * 2. EventStore persists event to invoice stream
 * 3. Event bus dispatches event to this handler
 * 4. Handler projects event data to InvoiceReadModel (PostgreSQL)
 *
 * Multi-Tenancy:
 * - tenantId extracted from event
 * - All database operations scoped to tenant
 * - Composite unique index ensures invoice number uniqueness per tenant
 */
@EventsHandler(InvoiceCreatedEvent)
export class InvoiceCreatedHandler implements IEventHandler<InvoiceCreatedEvent> {
  private readonly logger = new Logger(InvoiceCreatedHandler.name);

  constructor(
    @InjectRepository(InvoiceReadModel)
    private readonly invoiceRepository: Repository<InvoiceReadModel>,
  ) {}

  async handle(event: InvoiceCreatedEvent): Promise<void> {
    this.logger.debug(
      `Handling InvoiceCreatedEvent for invoice ${event.invoiceId.value} in tenant ${event.tenantId}`,
    );

    try {
      // Create new invoice read model from event data
      const invoice = this.invoiceRepository.create({
        id: event.invoiceId.value,
        invoiceNumber: event.invoiceNumber,
        vendorId: event.vendorId.value,
        customerId: event.customerId.value,
        invoiceDate: event.invoiceDate,
        dueDate: event.dueDate,
        fiscalYear: event.fiscalYear,
        tenantId: event.tenantId,

        // Initialize financial fields to zero
        lineItems: [],
        subtotal: 0,
        vatAmount: 0,
        supplementaryDuty: 0,
        advanceIncomeTax: 0,
        grandTotal: 0,

        // Status is DRAFT on creation
        status: InvoiceStatus.DRAFT,

        // Compliance fields initially null
        mushakNumber: null,
        challanNumber: null,
        vendorTIN: null,
        vendorBIN: null,
        customerTIN: null,
        customerBIN: null,
      });

      await this.invoiceRepository.save(invoice);

      this.logger.log(
        `Successfully projected InvoiceCreatedEvent for invoice ${event.invoiceId.value}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to handle InvoiceCreatedEvent for invoice ${event.invoiceId.value}: ${errorMessage}`,
      );

      // Re-throw to allow retry mechanisms
      throw error;
    }
  }
}
