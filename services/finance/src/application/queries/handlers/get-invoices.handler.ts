import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetInvoicesQuery } from '../get-invoices.query';
import { InvoiceDto, LineItemDto } from '../../../presentation/graphql/dto/invoice.dto';
import { MoneyDto } from '../../../presentation/graphql/dto/money.dto';
import { InvoiceReadModel } from '../../../infrastructure/persistence/typeorm/entities/invoice.entity';

/**
 * Get Invoices Query Handler
 *
 * Handles retrieval of multiple invoices from the read model (PostgreSQL).
 * Supports filtering by tenant/organization and pagination.
 *
 * CQRS Query Side:
 * - Reads from optimized PostgreSQL read model
 * - Supports efficient pagination with offset/limit
 * - Uses indexed queries for performance
 * - Multi-tenant filtering built-in
 *
 * Pagination:
 * - Default limit: 50 invoices per page
 * - Supports offset-based pagination
 * - Ordered by creation date (newest first)
 */
@QueryHandler(GetInvoicesQuery)
export class GetInvoicesHandler implements IQueryHandler<GetInvoicesQuery> {
  private readonly logger = new Logger(GetInvoicesHandler.name);

  constructor(
    @InjectRepository(InvoiceReadModel)
    private readonly readRepository: Repository<InvoiceReadModel>,
  ) {}

  async execute(query: GetInvoicesQuery): Promise<InvoiceDto[]> {
    this.logger.debug(
      `Fetching invoices with limit: ${query.limit}, offset: ${query.offset}`,
    );

    const whereClause: any = {};

    // Filter by tenant/organization if provided
    if (query.organizationId) {
      whereClause.tenantId = query.organizationId;
    }

    const invoices = await this.readRepository.find({
      where: whereClause,
      order: { createdAt: 'DESC' },
      take: query.limit,
      skip: query.offset,
    });

    this.logger.debug(`Found ${invoices.length} invoices`);

    return invoices.map((invoice) => this.mapToDto(invoice));
  }

  /**
   * Maps InvoiceReadModel entity to InvoiceDto
   * Converts database types to GraphQL-compatible DTOs
   */
  private mapToDto(entity: InvoiceReadModel): InvoiceDto {
    return {
      id: entity.id,
      invoiceNumber: entity.invoiceNumber,
      vendorId: entity.vendorId,
      customerId: entity.customerId,
      lineItems: this.mapLineItems(entity.lineItems),
      subtotal: this.createMoneyDto(Number(entity.subtotal), 'BDT'),
      vatAmount: this.createMoneyDto(Number(entity.vatAmount), 'BDT'),
      supplementaryDuty: this.createMoneyDto(Number(entity.supplementaryDuty), 'BDT'),
      advanceIncomeTax: this.createMoneyDto(Number(entity.advanceIncomeTax), 'BDT'),
      grandTotal: this.createMoneyDto(Number(entity.grandTotal), 'BDT'),
      status: entity.status,
      invoiceDate: entity.invoiceDate,
      dueDate: entity.dueDate,
      fiscalYear: entity.fiscalYear,
      mushakNumber: entity.mushakNumber || undefined,
      challanNumber: entity.challanNumber || undefined,
      vendorTIN: entity.vendorTIN || undefined,
      vendorBIN: entity.vendorBIN || undefined,
      customerTIN: entity.customerTIN || undefined,
      customerBIN: entity.customerBIN || undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Maps JSONB line items to LineItemDto array
   */
  private mapLineItems(lineItems: any[]): LineItemDto[] {
    return lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: this.createMoneyDto(item.unitPrice.amount, item.unitPrice.currency),
      amount: this.createMoneyDto(item.amount.amount, item.amount.currency),
      vatCategory: item.vatCategory,
      vatRate: item.vatRate,
      vatAmount: this.createMoneyDto(item.vatAmount.amount, item.vatAmount.currency),
      hsCode: item.hsCode,
      supplementaryDuty: item.supplementaryDuty
        ? this.createMoneyDto(item.supplementaryDuty.amount, item.supplementaryDuty.currency)
        : undefined,
      advanceIncomeTax: item.advanceIncomeTax
        ? this.createMoneyDto(item.advanceIncomeTax.amount, item.advanceIncomeTax.currency)
        : undefined,
    }));
  }

  /**
   * Creates MoneyDto with formatted amount
   * Formats according to Bangladesh Taka (BDT) convention
   */
  private createMoneyDto(amount: number, currency: string): MoneyDto {
    const formattedAmount =
      currency === 'BDT'
        ? `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `${currency} ${amount.toFixed(2)}`;

    return {
      amount,
      currency,
      formattedAmount,
    };
  }
}
