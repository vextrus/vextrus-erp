import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { GetPaymentsByStatusQuery } from '../get-payments-by-status.query';
import { PaymentReadModel } from '../../../infrastructure/persistence/typeorm/entities/payment.entity';

/**
 * Get Payments By Status Query Handler
 *
 * Retrieves payments filtered by status from the read model (PostgreSQL).
 * Useful for tracking pending, failed, or reconciliation-needed payments.
 *
 * Common Use Cases:
 * - PENDING: Payments awaiting processing
 * - PROCESSING: Payments in progress
 * - FAILED: Payments that need retry or cancellation
 * - COMPLETED: Payments ready for reconciliation
 *
 * Returns:
 * - Array of Payment DTOs with the specified status
 * - Paginated with limit/offset
 * - Ordered by payment date (most recent first)
 */
@QueryHandler(GetPaymentsByStatusQuery)
export class GetPaymentsByStatusHandler implements IQueryHandler<GetPaymentsByStatusQuery> {
  private readonly logger = new Logger(GetPaymentsByStatusHandler.name);

  constructor(
    @InjectRepository(PaymentReadModel)
    private readonly repository: Repository<PaymentReadModel>,
  ) {}

  async execute(query: GetPaymentsByStatusQuery): Promise<PaymentReadModel[]> {
    this.logger.debug(
      `Fetching payments with status ${query.status} for tenant ${query.tenantId}, ` +
      `limit=${query.limit}, offset=${query.offset}`
    );

    try {
      const payments = await this.repository.find({
        where: {
          status: query.status,
          tenantId: query.tenantId,
        },
        order: {
          paymentDate: 'DESC',
          createdAt: 'DESC',
        },
        skip: query.offset,
        take: query.limit,
      });

      this.logger.debug(`Found ${payments.length} payments with status ${query.status}`);
      return payments;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch payments by status: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
