import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { InvoiceCancelledEvent, InvoiceStatus } from '../../domain/aggregates/invoice/invoice.aggregate';
import { InvoiceReadModel } from '../persistence/typeorm/entities/invoice.entity';

/**
 * InvoiceCancelled Event Handler
 *
 * Handles InvoiceCancelledEvent to update invoice status to CANCELLED in the PostgreSQL read model.
 * This event records invoice cancellations with reason and audit trail.
 *
 * Data Flow:
 * 1. Invoice.cancel() → InvoiceCancelledEvent emitted
 * 2. EventStore persists event to invoice stream
 * 3. Event bus dispatches event to this handler
 * 4. Handler updates InvoiceReadModel status to CANCELLED
 *
 * Business Rules:
 * - DRAFT and PENDING_APPROVAL invoices can be cancelled
 * - PAID invoices cannot be cancelled (enforced by domain aggregate)
 * - Cancellation reason is required (enforced by domain aggregate)
 * - Audit trail maintained via EventStore event history
 *
 * Status Transitions:
 * DRAFT → CANCELLED
 * PENDING_APPROVAL → CANCELLED
 * APPROVED → CANCELLED (with proper authorization)
 *
 * Note: The cancellation reason and cancelledBy are stored in EventStore
 * for audit purposes but not projected to the read model.
 * Use EventStore queries for detailed audit reports.
 */
@EventsHandler(InvoiceCancelledEvent)
export class InvoiceCancelledHandler implements IEventHandler<InvoiceCancelledEvent> {
  private readonly logger = new Logger(InvoiceCancelledHandler.name);

  constructor(
    @InjectRepository(InvoiceReadModel)
    private readonly invoiceRepository: Repository<InvoiceReadModel>,
  ) {}

  async handle(event: InvoiceCancelledEvent): Promise<void> {
    this.logger.debug(
      `Handling InvoiceCancelledEvent for invoice ${event.invoiceId.value} in tenant ${event.tenantId}`,
    );

    try {
      // Find the invoice read model
      const invoice = await this.invoiceRepository.findOne({
        where: {
          id: event.invoiceId.value,
          tenantId: event.tenantId,
        },
      });

      if (!invoice) {
        this.logger.warn(
          `Invoice ${event.invoiceId.value} not found in read model for InvoiceCancelledEvent`,
        );
        return;
      }

      // Update status to CANCELLED
      await this.invoiceRepository.update(
        {
          id: event.invoiceId.value,
          tenantId: event.tenantId,
        },
        {
          status: InvoiceStatus.CANCELLED,
        },
      );

      this.logger.log(
        `Successfully projected InvoiceCancelledEvent for invoice ${event.invoiceId.value}. ` +
          `Cancelled by: ${event.cancelledBy.value}. Reason: ${event.reason}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to handle InvoiceCancelledEvent for invoice ${event.invoiceId.value}: ${errorMessage}`,
      );

      // Re-throw to allow retry mechanisms
      throw error;
    }
  }
}
