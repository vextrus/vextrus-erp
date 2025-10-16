import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { LineItemAddedEvent } from '../../domain/aggregates/invoice/invoice.aggregate';
import { InvoiceReadModel } from '../persistence/typeorm/entities/invoice.entity';

/**
 * LineItemAdded Event Handler
 *
 * Handles LineItemAddedEvent to update the invoice's line items in the PostgreSQL read model.
 * Updates the JSONB lineItems array with the new line item.
 *
 * Data Flow:
 * 1. Invoice.addLineItem() → LineItemAddedEvent emitted
 * 2. EventStore persists event to invoice stream
 * 3. Event bus dispatches event to this handler
 * 4. Handler appends line item to InvoiceReadModel.lineItems JSONB array
 *
 * JSONB Schema for Line Items:
 * {
 *   id: string,
 *   description: string,
 *   quantity: number,
 *   unitPrice: { amount: number, currency: string },
 *   amount: { amount: number, currency: string },
 *   vatCategory: string,
 *   vatRate: number,
 *   vatAmount: { amount: number, currency: string },
 *   hsCode?: string,
 *   supplementaryDuty?: { amount: number, currency: string },
 *   advanceIncomeTax?: { amount: number, currency: string }
 * }
 */
@EventsHandler(LineItemAddedEvent)
export class LineItemAddedHandler implements IEventHandler<LineItemAddedEvent> {
  private readonly logger = new Logger(LineItemAddedHandler.name);

  constructor(
    @InjectRepository(InvoiceReadModel)
    private readonly invoiceRepository: Repository<InvoiceReadModel>,
  ) {}

  async handle(event: LineItemAddedEvent): Promise<void> {
    this.logger.debug(
      `Handling LineItemAddedEvent for invoice ${event.invoiceId.value} in tenant ${event.tenantId}`,
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
          `Invoice ${event.invoiceId.value} not found in read model for LineItemAddedEvent`,
        );
        return;
      }

      // Map line item to JSONB-compatible structure
      const lineItemData = {
        id: event.lineItem.id.value,
        description: event.lineItem.description,
        quantity: event.lineItem.quantity,
        unitPrice: {
          amount: event.lineItem.unitPrice.amount,
          currency: event.lineItem.unitPrice.getCurrency(),
        },
        amount: {
          amount: event.lineItem.amount.amount,
          currency: event.lineItem.amount.getCurrency(),
        },
        vatCategory: event.lineItem.vatCategory,
        vatRate: event.lineItem.vatRate,
        vatAmount: {
          amount: event.lineItem.vatAmount.amount,
          currency: event.lineItem.vatAmount.getCurrency(),
        },
        hsCode: event.lineItem.hsCode,
        supplementaryDuty: event.lineItem.supplementaryDuty
          ? {
              amount: event.lineItem.supplementaryDuty.amount,
              currency: event.lineItem.supplementaryDuty.getCurrency(),
            }
          : undefined,
        advanceIncomeTax: event.lineItem.advanceIncomeTax
          ? {
              amount: event.lineItem.advanceIncomeTax.amount,
              currency: event.lineItem.advanceIncomeTax.getCurrency(),
            }
          : undefined,
      };

      // Append to existing line items array
      const updatedLineItems = [...invoice.lineItems, lineItemData];

      // Update invoice with new line items
      await this.invoiceRepository.update(
        {
          id: event.invoiceId.value,
          tenantId: event.tenantId,
        },
        {
          lineItems: updatedLineItems,
        },
      );

      this.logger.log(
        `Successfully projected LineItemAddedEvent for invoice ${event.invoiceId.value}. Total line items: ${updatedLineItems.length}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to handle LineItemAddedEvent for invoice ${event.invoiceId.value}: ${errorMessage}`,
      );

      // Re-throw to allow retry mechanisms
      throw error;
    }
  }
}
