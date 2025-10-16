import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { InvoiceCalculatedEvent } from '../../domain/aggregates/invoice/invoice.aggregate';
import { InvoiceReadModel } from '../persistence/typeorm/entities/invoice.entity';

/**
 * InvoiceCalculated Event Handler
 *
 * Handles InvoiceCalculatedEvent to update financial totals in the PostgreSQL read model.
 * This event is triggered after line items are added or modified, recalculating all financial fields.
 *
 * Data Flow:
 * 1. Invoice.recalculateTotals() → InvoiceCalculatedEvent emitted
 * 2. EventStore persists event to invoice stream
 * 3. Event bus dispatches event to this handler
 * 4. Handler updates InvoiceReadModel financial fields (subtotal, VAT, grand total, etc.)
 *
 * Financial Calculations (Bangladesh):
 * - Subtotal: Sum of all line item amounts
 * - VAT: Based on Bangladesh NBR rates (15%, 7.5%, 5%, 0%)
 * - Supplementary Duty: Additional tax on specific goods
 * - Advance Income Tax: Withholding tax deducted at source
 * - Grand Total: Subtotal + VAT + Supplementary Duty - Advance Income Tax
 */
@EventsHandler(InvoiceCalculatedEvent)
export class InvoiceCalculatedHandler implements IEventHandler<InvoiceCalculatedEvent> {
  private readonly logger = new Logger(InvoiceCalculatedHandler.name);

  constructor(
    @InjectRepository(InvoiceReadModel)
    private readonly invoiceRepository: Repository<InvoiceReadModel>,
  ) {}

  async handle(event: InvoiceCalculatedEvent): Promise<void> {
    this.logger.debug(
      `Handling InvoiceCalculatedEvent for invoice ${event.invoiceId.value} in tenant ${event.tenantId}`,
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
          `Invoice ${event.invoiceId.value} not found in read model for InvoiceCalculatedEvent`,
        );
        return;
      }

      // Update financial totals from event
      await this.invoiceRepository.update(
        {
          id: event.invoiceId.value,
          tenantId: event.tenantId,
        },
        {
          subtotal: event.subtotal.amount,
          vatAmount: event.vatAmount.amount,
          supplementaryDuty: event.supplementaryDuty.amount,
          advanceIncomeTax: event.advanceIncomeTax.amount,
          grandTotal: event.grandTotal.amount,
        },
      );

      this.logger.log(
        `Successfully projected InvoiceCalculatedEvent for invoice ${event.invoiceId.value}. ` +
          `Grand Total: ${event.grandTotal.amount} ${event.grandTotal.getCurrency()}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to handle InvoiceCalculatedEvent for invoice ${event.invoiceId.value}: ${errorMessage}`,
      );

      // Re-throw to allow retry mechanisms
      throw error;
    }
  }
}
