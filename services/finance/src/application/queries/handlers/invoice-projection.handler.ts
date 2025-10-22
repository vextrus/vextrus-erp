import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import {
  InvoiceCreatedEvent,
  InvoiceApprovedEvent,
  InvoiceCancelledEvent,
  LineItemAddedEvent,
  InvoiceCalculatedEvent,
} from '../../../domain/aggregates/invoice/invoice.aggregate';
import {
  InvoicePaymentRecordedEvent,
  InvoiceFullyPaidEvent,
} from '../../../domain/aggregates/invoice/events/invoice-payment-recorded.event';
import { InvoiceProjection, FinancialSummaryProjection, EntityTransactionProjection } from '../projections/invoice.projection';
import { MasterDataDataLoader } from '../../../infrastructure/integrations/master-data.dataloader';
import { FinanceCacheService } from '../../../infrastructure/cache/cache.service';

@EventsHandler(
  InvoiceCreatedEvent,
  InvoiceApprovedEvent,
  LineItemAddedEvent,
  InvoiceCalculatedEvent,
  InvoiceCancelledEvent,
  InvoicePaymentRecordedEvent,
  InvoiceFullyPaidEvent,
)
export class InvoiceProjectionHandler implements IEventHandler {
  private readonly logger = new Logger(InvoiceProjectionHandler.name);

  constructor(
    @InjectRepository(InvoiceProjection)
    private readonly invoiceRepository: Repository<InvoiceProjection>,
    @InjectRepository(FinancialSummaryProjection)
    private readonly summaryRepository: Repository<FinancialSummaryProjection>,
    @InjectRepository(EntityTransactionProjection)
    private readonly entityTransactionRepository: Repository<EntityTransactionProjection>,
    private readonly masterDataLoader: MasterDataDataLoader,
    private readonly cacheService: FinanceCacheService,
  ) {}

  async handle(event: any): Promise<void> {
    try {
      switch (event.constructor.name) {
        case 'InvoiceCreatedEvent':
          await this.handleInvoiceCreated(event as InvoiceCreatedEvent);
          break;
        case 'LineItemAddedEvent':
          await this.handleLineItemAdded(event as LineItemAddedEvent);
          break;
        case 'InvoiceCalculatedEvent':
          await this.handleInvoiceCalculated(event as InvoiceCalculatedEvent);
          break;
        case 'InvoiceApprovedEvent':
          await this.handleInvoiceApproved(event as InvoiceApprovedEvent);
          break;
        case 'InvoiceCancelledEvent':
          await this.handleInvoiceCancelled(event as InvoiceCancelledEvent);
          break;
        case 'InvoicePaymentRecordedEvent':
          await this.handleInvoicePaymentRecorded(event as InvoicePaymentRecordedEvent);
          break;
        case 'InvoiceFullyPaidEvent':
          await this.handleInvoiceFullyPaid(event as InvoiceFullyPaidEvent);
          break;
      }
    } catch (error) {
      this.logger.error(`Error handling ${event.constructor.name}:`, error);
      // Don't throw - projection errors shouldn't stop the event flow
    }
  }

  private async handleInvoiceCreated(event: InvoiceCreatedEvent): Promise<void> {
    // Create or update the invoice projection
    let projection = await this.invoiceRepository.findOne({
      where: { id: event.invoiceId.value }
    });

    if (!projection) {
      projection = new InvoiceProjection();
      projection.id = event.invoiceId.value;
    }

    projection.invoiceNumber = event.invoiceNumber;
    projection.tenantId = event.tenantId;
    projection.vendorId = event.vendorId.value;
    projection.customerId = event.customerId.value;
    projection.invoiceDate = event.invoiceDate;
    projection.dueDate = event.dueDate;
    projection.fiscalYear = event.fiscalYear;
    projection.status = 'DRAFT';
    projection.lineItems = [];
    projection.subtotal = 0;
    projection.vatAmount = 0;
    projection.supplementaryDuty = 0;
    projection.advanceIncomeTax = 0;
    projection.grandTotal = 0;
    projection.currency = 'BDT';
    projection.paidAmount = 0;
    projection.balanceAmount = 0;

    // Fetch vendor details (batched via DataLoader)
    try {
      const vendor = await this.masterDataLoader.loadVendor(event.vendorId.value);
      if (vendor) {
        projection.vendorName = vendor.name;
        projection.vendorTin = vendor.tin;
        projection.vendorBin = vendor.bin;
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch vendor details for ${event.vendorId.value}:`, error);
    }

    // Fetch customer details (batched via DataLoader)
    try {
      const customer = await this.masterDataLoader.loadCustomer(event.customerId.value);
      if (customer) {
        projection.customerName = customer.name;
        projection.customerTin = customer.tin;
        projection.customerBin = customer.bin;
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch customer details for ${event.customerId.value}:`, error);
    }

    await this.invoiceRepository.save(projection);

    // Invalidate cache after successful update
    await this.cacheService.invalidateInvoice(event.tenantId, event.invoiceId.value);
    this.logger.debug(`Invalidated cache for invoice ${event.invoiceId.value}`);

    // Initialize entity transaction projection for the customer
    await this.updateEntityTransactionProjection(
      event.tenantId,
      'CUSTOMER',
      event.customerId.value,
      projection.customerName || 'Unknown',
      event.invoiceDate,
    );
  }

  private async handleLineItemAdded(event: LineItemAddedEvent): Promise<void> {
    const projection = await this.invoiceRepository.findOne({
      where: { id: event.invoiceId.value }
    });

    if (!projection) {
      this.logger.warn(`Invoice projection not found for ${event.invoiceId.value}`);
      return;
    }

    // Add the line item
    const lineItem = {
      id: event.lineItem.id.value,
      description: event.lineItem.description,
      quantity: event.lineItem.quantity,
      unitPrice: event.lineItem.unitPrice.getAmount(),
      amount: event.lineItem.amount.getAmount(),
      vatCategory: event.lineItem.vatCategory,
      vatRate: event.lineItem.vatRate,
      vatAmount: event.lineItem.vatAmount.getAmount(),
      hsCode: event.lineItem.hsCode,
      supplementaryDuty: event.lineItem.supplementaryDuty?.getAmount() || 0,
      advanceIncomeTax: event.lineItem.advanceIncomeTax?.getAmount() || 0,
    };

    projection.lineItems = [...projection.lineItems, lineItem];
    await this.invoiceRepository.save(projection);

    // Invalidate cache after successful update
    await this.cacheService.invalidateInvoice(event.tenantId, event.invoiceId.value);
    this.logger.debug(`Invalidated cache for invoice ${event.invoiceId.value}`);
  }

  private async handleInvoiceCalculated(event: InvoiceCalculatedEvent): Promise<void> {
    const projection = await this.invoiceRepository.findOne({
      where: { id: event.invoiceId.value }
    });

    if (!projection) {
      this.logger.warn(`Invoice projection not found for ${event.invoiceId.value}`);
      return;
    }

    projection.subtotal = event.subtotal.getAmount();
    projection.vatAmount = event.vatAmount.getAmount();
    projection.supplementaryDuty = event.supplementaryDuty.getAmount();
    projection.advanceIncomeTax = event.advanceIncomeTax.getAmount();
    projection.grandTotal = event.grandTotal.getAmount();
    projection.balanceAmount = event.grandTotal.getAmount();

    await this.invoiceRepository.save(projection);

    // Invalidate cache after successful update
    await this.cacheService.invalidateInvoice(event.tenantId, event.invoiceId.value);
    this.logger.debug(`Invalidated cache for invoice ${event.invoiceId.value}`);

    // Update financial summary
    await this.updateFinancialSummary(projection);
  }

  private async handleInvoiceApproved(event: InvoiceApprovedEvent): Promise<void> {
    const projection = await this.invoiceRepository.findOne({
      where: { id: event.invoiceId.value }
    });

    if (!projection) {
      this.logger.warn(`Invoice projection not found for ${event.invoiceId.value}`);
      return;
    }

    projection.status = 'APPROVED';
    projection.approvedBy = event.approvedBy.value;
    projection.approvedAt = event.approvedAt;
    projection.mushakNumber = event.mushakNumber;

    await this.invoiceRepository.save(projection);

    // Invalidate cache after successful update
    await this.cacheService.invalidateInvoice(event.tenantId, event.invoiceId.value);
    this.logger.debug(`Invalidated cache for invoice ${event.invoiceId.value}`);

    // Update entity transaction summary
    await this.updateEntityTransactionOnApproval(projection);
  }

  private async handleInvoiceCancelled(event: InvoiceCancelledEvent): Promise<void> {
    const projection = await this.invoiceRepository.findOne({
      where: { id: event.invoiceId.value }
    });

    if (!projection) {
      this.logger.warn(`Invoice projection not found for ${event.invoiceId.value}`);
      return;
    }

    const previousStatus = projection.status;
    projection.status = 'CANCELLED';

    await this.invoiceRepository.save(projection);

    // Invalidate cache after successful update
    await this.cacheService.invalidateInvoice(event.tenantId, event.invoiceId.value);
    this.logger.debug(`Invalidated cache for invoice ${event.invoiceId.value}`);

    // Reverse financial summary if invoice was approved
    if (previousStatus === 'APPROVED') {
      await this.reverseFinancialSummary(projection);
    }
  }

  private async updateFinancialSummary(invoice: InvoiceProjection): Promise<void> {
    const period = this.getPeriod(invoice.invoiceDate);
    const summaryId = `${invoice.tenantId}-${period}`;

    let summary = await this.summaryRepository.findOne({
      where: { id: summaryId }
    });

    if (!summary) {
      summary = new FinancialSummaryProjection();
      summary.id = summaryId;
      summary.tenantId = invoice.tenantId;
      summary.period = period;
      summary.fiscalYear = invoice.fiscalYear;
    }

    // Update revenue summary
    summary.totalRevenue += invoice.subtotal;
    summary.totalVATCollected += invoice.vatAmount;
    summary.invoiceCount += 1;
    summary.accountsReceivable += invoice.grandTotal;

    // Check if overdue
    if (new Date() > invoice.dueDate && invoice.status === 'APPROVED') {
      summary.overdueInvoices += 1;
    }

    await this.summaryRepository.save(summary);
  }

  private async reverseFinancialSummary(invoice: InvoiceProjection): Promise<void> {
    const period = this.getPeriod(invoice.invoiceDate);
    const summaryId = `${invoice.tenantId}-${period}`;

    const summary = await this.summaryRepository.findOne({
      where: { id: summaryId }
    });

    if (!summary) {
      return;
    }

    // Reverse the amounts
    summary.totalRevenue -= invoice.subtotal;
    summary.totalVATCollected -= invoice.vatAmount;
    summary.invoiceCount -= 1;
    summary.accountsReceivable -= invoice.grandTotal;

    if (new Date() > invoice.dueDate) {
      summary.overdueInvoices = Math.max(0, summary.overdueInvoices - 1);
    }

    await this.summaryRepository.save(summary);
  }

  private async updateEntityTransactionProjection(
    tenantId: string,
    entityType: 'VENDOR' | 'CUSTOMER',
    entityId: string,
    entityName: string,
    transactionDate: Date,
  ): Promise<void> {
    const period = this.getPeriod(transactionDate);
    const projectionId = `${tenantId}-${entityType}-${entityId}-${period}`;

    let projection = await this.entityTransactionRepository.findOne({
      where: { id: projectionId }
    });

    if (!projection) {
      projection = new EntityTransactionProjection();
      projection.id = projectionId;
      projection.tenantId = tenantId;
      projection.entityType = entityType;
      projection.entityId = entityId;
      projection.entityName = entityName;
      projection.period = period;
      projection.openingBalance = 0;
      projection.totalInvoiced = 0;
      projection.totalPaid = 0;
      projection.closingBalance = 0;
      projection.transactionCount = 0;
      projection.overdueCount = 0;
      projection.overdueAmount = 0;
    }

    projection.lastTransactionDate = transactionDate;
    await this.entityTransactionRepository.save(projection);
  }

  private async updateEntityTransactionOnApproval(invoice: InvoiceProjection): Promise<void> {
    const period = this.getPeriod(invoice.invoiceDate);
    const projectionId = `${invoice.tenantId}-CUSTOMER-${invoice.customerId}-${period}`;

    const projection = await this.entityTransactionRepository.findOne({
      where: { id: projectionId }
    });

    if (!projection) {
      return;
    }

    projection.totalInvoiced += invoice.grandTotal;
    projection.closingBalance = projection.openingBalance + projection.totalInvoiced - projection.totalPaid;
    projection.transactionCount += 1;

    // Check if overdue
    if (new Date() > invoice.dueDate) {
      projection.overdueCount += 1;
      projection.overdueAmount += invoice.balanceAmount;
    }

    await this.entityTransactionRepository.save(projection);
  }

  /**
   * Handle InvoicePaymentRecordedEvent
   * Updates paid amount and balance amount in the projection
   */
  private async handleInvoicePaymentRecorded(event: InvoicePaymentRecordedEvent): Promise<void> {
    const projection = await this.invoiceRepository.findOne({
      where: { id: event.invoiceId.value }
    });

    if (!projection) {
      this.logger.warn(`Invoice projection not found for ${event.invoiceId.value}`);
      return;
    }

    // Update paid amount and balance
    projection.paidAmount = event.newPaidAmount.getAmount();
    projection.balanceAmount = event.remainingAmount.getAmount();

    await this.invoiceRepository.save(projection);

    // Invalidate cache after successful update
    await this.cacheService.invalidateInvoice(event.tenantId, event.invoiceId.value);
    this.logger.debug(
      `Updated invoice ${event.invoiceId.value} payment: ` +
      `paidAmount=${projection.paidAmount}, balanceAmount=${projection.balanceAmount}`
    );

    // Update entity transaction projection (customer payment tracking)
    await this.updateEntityTransactionOnPayment(projection, event.paymentAmount.getAmount());
  }

  /**
   * Handle InvoiceFullyPaidEvent
   * Transitions invoice status to PAID and updates financial summaries
   */
  private async handleInvoiceFullyPaid(event: InvoiceFullyPaidEvent): Promise<void> {
    const projection = await this.invoiceRepository.findOne({
      where: { id: event.invoiceId.value }
    });

    if (!projection) {
      this.logger.warn(`Invoice projection not found for ${event.invoiceId.value}`);
      return;
    }

    // Transition to PAID status
    projection.status = 'PAID';
    projection.paidAt = event.paidAt;

    await this.invoiceRepository.save(projection);

    // Invalidate cache after successful update
    await this.cacheService.invalidateInvoice(event.tenantId, event.invoiceId.value);
    this.logger.log(`Invoice ${event.invoiceId.value} fully paid and status updated to PAID`);

    // Update financial summary (reduce accounts receivable)
    await this.updateFinancialSummaryOnPayment(projection);
  }

  /**
   * Update entity transaction projection when payment is recorded
   * Tracks customer payment activity
   */
  private async updateEntityTransactionOnPayment(
    invoice: InvoiceProjection,
    paymentAmount: number,
  ): Promise<void> {
    const period = this.getPeriod(invoice.invoiceDate);
    const projectionId = `${invoice.tenantId}-CUSTOMER-${invoice.customerId}-${period}`;

    const projection = await this.entityTransactionRepository.findOne({
      where: { id: projectionId }
    });

    if (!projection) {
      return;
    }

    // Update payment tracking
    projection.totalPaid += paymentAmount;
    projection.closingBalance = projection.openingBalance + projection.totalInvoiced - projection.totalPaid;

    // Update overdue if this payment reduced overdue amount
    if (invoice.balanceAmount === 0 && new Date() > invoice.dueDate) {
      projection.overdueCount = Math.max(0, projection.overdueCount - 1);
      projection.overdueAmount = Math.max(0, projection.overdueAmount - paymentAmount);
    }

    await this.entityTransactionRepository.save(projection);
  }

  /**
   * Update financial summary when invoice is fully paid
   * Reduces accounts receivable
   */
  private async updateFinancialSummaryOnPayment(invoice: InvoiceProjection): Promise<void> {
    const period = this.getPeriod(invoice.invoiceDate);
    const summaryId = `${invoice.tenantId}-${period}`;

    const summary = await this.summaryRepository.findOne({
      where: { id: summaryId }
    });

    if (!summary) {
      return;
    }

    // Reduce accounts receivable (invoice is now paid)
    summary.accountsReceivable = Math.max(0, summary.accountsReceivable - invoice.grandTotal);

    // Reduce overdue count if invoice was overdue
    if (new Date() > invoice.dueDate) {
      summary.overdueInvoices = Math.max(0, summary.overdueInvoices - 1);
    }

    await this.summaryRepository.save(summary);
  }

  private getPeriod(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}