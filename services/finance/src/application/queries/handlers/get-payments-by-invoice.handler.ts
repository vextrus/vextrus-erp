import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { GetPaymentsByInvoiceQuery } from '../get-payments-by-invoice.query';
import { PaymentReadModel } from '../../../infrastructure/persistence/typeorm/entities/payment.entity';

/**
 * Get Payments By Invoice Query Handler
 *
 * Retrieves all payments for a specific invoice from the read model (PostgreSQL).
 * Useful for tracking invoice payment history and balance calculation.
 *
 * Returns:
 * - Array of Payment DTOs for the specified invoice
 * - Ordered by payment date (most recent first)
 */
@QueryHandler(GetPaymentsByInvoiceQuery)
export class GetPaymentsByInvoiceHandler implements IQueryHandler<GetPaymentsByInvoiceQuery> {
  private readonly logger = new Logger(GetPaymentsByInvoiceHandler.name);

  constructor(
    @InjectRepository(PaymentReadModel)
    private readonly repository: Repository<PaymentReadModel>,
  ) {}

  async execute(query: GetPaymentsByInvoiceQuery): Promise<PaymentReadModel[]> {
    this.logger.debug(`Fetching payments for invoice ${query.invoiceId}, tenant ${query.tenantId}`);

    try {
      const payments = await this.repository.find({
        where: {
          invoiceId: query.invoiceId,
          tenantId: query.tenantId,
        },
        order: {
          paymentDate: 'DESC',
          createdAt: 'DESC',
        },
      });

      this.logger.debug(`Found ${payments.length} payments for invoice ${query.invoiceId}`);
      return payments;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch payments by invoice: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
