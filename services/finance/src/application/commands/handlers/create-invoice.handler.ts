import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CreateInvoiceCommand } from '../create-invoice.command';
import { IInvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { Invoice, VendorId, CustomerId, LineItemDto } from '../../../domain/aggregates/invoice/invoice.aggregate';
import { TenantId } from '../../../domain/aggregates/chart-of-account/chart-of-account.aggregate';
import { TaxCalculationService, TaxType, ProductCategory } from '../../services/tax-calculation.service';
import Decimal from 'decimal.js';

/**
 * Create Invoice Command Handler
 *
 * Handles the creation of new invoices using CQRS pattern with automatic VAT calculation.
 * Creates an Invoice aggregate with calculated VAT, persists it to EventStore,
 * and publishes domain events to Kafka via EventBus.
 *
 * Bangladesh Compliance:
 * - Automatically calculates 15% VAT on all line items
 * - Supports VAT exemptions for specific product categories
 * - Calculates supplementary duty for luxury items if specified
 * - Fiscal year validation (July-June)
 */
@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  private readonly logger = new Logger(CreateInvoiceHandler.name);

  constructor(
    @Inject('IInvoiceRepository')
    private readonly repository: IInvoiceRepository,
    private readonly eventBus: EventBus,
    private readonly taxCalculationService: TaxCalculationService,
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<string> {
    this.logger.log(`Creating invoice for customer: ${command.customerId}`);

    try {
      // Calculate VAT for all line items automatically
      const lineItemsWithVAT = await this.calculateLineItemsVAT(command.lineItems, command.invoiceDate);

      this.logger.log(`Calculated VAT for ${lineItemsWithVAT.length} line items. Total VAT: ${this.calculateTotalVAT(lineItemsWithVAT)}`);

      // Create the invoice aggregate using domain logic with calculated VAT
      const invoice = Invoice.create({
        vendorId: new VendorId(command.vendorId),
        customerId: new CustomerId(command.customerId),
        invoiceDate: command.invoiceDate,
        dueDate: command.dueDate,
        tenantId: new TenantId(command.tenantId),
        lineItems: lineItemsWithVAT,
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

  /**
   * Calculate VAT for all line items
   * Applies Bangladesh 15% standard VAT rate with support for exemptions
   */
  private async calculateLineItemsVAT(lineItems: LineItemDto[], invoiceDate: Date): Promise<LineItemDto[]> {
    const fiscalYear = this.taxCalculationService.getCurrentFiscalYear(invoiceDate);
    this.logger.log(`Calculating VAT for fiscal year ${fiscalYear.year}`);

    return Promise.all(
      lineItems.map(async (item) => {
        // Determine product category (default to STANDARD if not specified)
        const productCategory = (item as any).productCategory || ProductCategory.STANDARD;
        const isExempt = productCategory === ProductCategory.EXEMPT;

        // Convert Money to number if needed
        const itemAmount = typeof item.amount === 'number' ? item.amount : (item.amount as any)?.amount || 0;

        // Calculate VAT using TaxCalculationService
        const vatResult = await this.taxCalculationService.calculateTax({
          amount: itemAmount,
          taxType: TaxType.VAT,
          productCategory,
          isExempt,
          transactionDate: invoiceDate
        });

        // Calculate supplementary duty if applicable
        let supplementaryDuty: number | undefined;
        if ([ProductCategory.LUXURY, ProductCategory.TOBACCO, ProductCategory.BEVERAGE, ProductCategory.ELECTRONICS].includes(productCategory)) {
          const sdResult = await this.taxCalculationService.calculateTax({
            amount: itemAmount,
            taxType: TaxType.SUPPLEMENTARY_DUTY,
            productCategory,
            transactionDate: invoiceDate
          });
          supplementaryDuty = sdResult.taxAmount;
        }

        // Return line item with calculated VAT
        return {
          ...item,
          vatRate: vatResult.taxRate,
          vatAmount: vatResult.taxAmount,
          supplementaryDuty,
          totalWithVAT: vatResult.totalAmount
        } as any;
      })
    );
  }

  /**
   * Calculate total VAT amount from all line items
   */
  private calculateTotalVAT(lineItems: LineItemDto[]): string {
    const total = lineItems.reduce((sum, item) => {
      return sum.add(new Decimal((item as any).vatAmount || 0));
    }, new Decimal(0));

    return total.toFixed(2);
  }
}
