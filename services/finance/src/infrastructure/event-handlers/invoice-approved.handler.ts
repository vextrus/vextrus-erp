import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { InvoiceApprovedEvent, InvoiceStatus } from '../../domain/aggregates/invoice/invoice.aggregate';
import { InvoiceReadModel } from '../persistence/typeorm/entities/invoice.entity';

/**
 * InvoiceApproved Event Handler
 *
 * Handles InvoiceApprovedEvent to update invoice status and generate Mushak number.
 * This event marks the invoice as approved and assigns a NBR-compliant Mushak number.
 *
 * Data Flow:
 * 1. Invoice.approve() → InvoiceApprovedEvent emitted
 * 2. EventStore persists event to invoice stream
 * 3. Event bus dispatches event to this handler
 * 4. Handler updates InvoiceReadModel status to APPROVED and sets mushakNumber
 *
 * Bangladesh Compliance:
 * - Mushak Number: Format MUSHAK-6.3-YYYY-MM-NNNNNN
 * - Mushak-6.3: Standard VAT invoice format mandated by NBR
 * - Required for all VAT-registered businesses
 * - Must be assigned before invoice is considered legally valid
 *
 * Status Transition:
 * DRAFT → APPROVED (other transitions prevented by domain aggregate)
 */
@EventsHandler(InvoiceApprovedEvent)
export class InvoiceApprovedHandler implements IEventHandler<InvoiceApprovedEvent> {
  private readonly logger = new Logger(InvoiceApprovedHandler.name);

  constructor(
    @InjectRepository(InvoiceReadModel)
    private readonly invoiceRepository: Repository<InvoiceReadModel>,
  ) {}

  async handle(event: InvoiceApprovedEvent): Promise<void> {
    this.logger.debug(
      `Handling InvoiceApprovedEvent for invoice ${event.invoiceId.value} in tenant ${event.tenantId}`,
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
          `Invoice ${event.invoiceId.value} not found in read model for InvoiceApprovedEvent`,
        );
        return;
      }

      // Update status to APPROVED and set Mushak number
      await this.invoiceRepository.update(
        {
          id: event.invoiceId.value,
          tenantId: event.tenantId,
        },
        {
          status: InvoiceStatus.APPROVED,
          mushakNumber: event.mushakNumber,
        },
      );

      this.logger.log(
        `Successfully projected InvoiceApprovedEvent for invoice ${event.invoiceId.value}. ` +
          `Mushak Number: ${event.mushakNumber}. Approved by: ${event.approvedBy.value}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to handle InvoiceApprovedEvent for invoice ${event.invoiceId.value}: ${errorMessage}`,
      );

      // Re-throw to allow retry mechanisms
      throw error;
    }
  }
}
