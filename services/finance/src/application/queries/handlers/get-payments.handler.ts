import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { GetPaymentsQuery } from '../get-payments.query';
import { PaymentReadModel } from '../../../infrastructure/persistence/typeorm/entities/payment.entity';

/**
 * Get Payments Query Handler
 *
 * Retrieves payments with optional filters from the read model (PostgreSQL).
 * Supports pagination and filtering by invoice, status, and payment method.
 *
 * Filters:
 * - tenantId: Required for multi-tenant isolation
 * - invoiceId: Optional filter by specific invoice
 * - status: Optional filter by payment status
 * - paymentMethod: Optional filter by payment method
 * - limit/offset: Pagination parameters
 *
 * Returns:
 * - Array of Payment DTOs
 * - Ordered by payment date (most recent first)
 */
@QueryHandler(GetPaymentsQuery)
export class GetPaymentsHandler implements IQueryHandler<GetPaymentsQuery> {
  private readonly logger = new Logger(GetPaymentsHandler.name);

  constructor(
    @InjectRepository(PaymentReadModel)
    private readonly repository: Repository<PaymentReadModel>,
  ) {}

  async execute(query: GetPaymentsQuery): Promise<PaymentReadModel[]> {
    this.logger.debug(
      `Fetching payments for tenant ${query.tenantId} with filters: ` +
      `invoiceId=${query.invoiceId}, status=${query.status}, paymentMethod=${query.paymentMethod}, ` +
      `limit=${query.limit}, offset=${query.offset}`
    );

    try {
      // Build query with filters
      const queryBuilder = this.repository
        .createQueryBuilder('payment')
        .where('payment.tenantId = :tenantId', { tenantId: query.tenantId });

      // Apply optional filters
      if (query.invoiceId) {
        queryBuilder.andWhere('payment.invoiceId = :invoiceId', { invoiceId: query.invoiceId });
      }

      if (query.status) {
        queryBuilder.andWhere('payment.status = :status', { status: query.status });
      }

      if (query.paymentMethod) {
        queryBuilder.andWhere('payment.paymentMethod = :paymentMethod', { paymentMethod: query.paymentMethod });
      }

      // Apply pagination and ordering
      const payments = await queryBuilder
        .orderBy('payment.paymentDate', 'DESC')
        .addOrderBy('payment.createdAt', 'DESC')
        .skip(query.offset)
        .take(query.limit)
        .getMany();

      this.logger.debug(`Found ${payments.length} payments for tenant ${query.tenantId}`);
      return payments;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch payments: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
