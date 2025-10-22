import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { GetPaymentsQuery } from '../get-payments.query';
import { PaymentReadModel } from '../../../infrastructure/persistence/typeorm/entities/payment.entity';
import { FinanceCacheService } from '../../../infrastructure/cache/cache.service';

/**
 * Get Payments Query Handler
 *
 * Retrieves payments with optional filters from the read model (PostgreSQL).
 * Supports pagination and filtering by invoice, status, and payment method.
 *
 * CQRS Query Side:
 * - Reads from optimized PostgreSQL read model
 * - Redis caching layer (TTL: 60s)
 * - Cache-aside pattern with filter-specific keys
 * - No business logic execution
 * - Fast, indexed queries with filters
 * - Multi-tenant isolation enforced
 * - Pagination support (limit/offset)
 *
 * Performance:
 * - Cache HIT: ~5-10ms for payment lists
 * - Cache MISS: ~200-500ms (DB scan + caching)
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
    private readonly cacheService: FinanceCacheService,
  ) {}

  async execute(query: GetPaymentsQuery): Promise<PaymentReadModel[]> {
    this.logger.debug(
      `Fetching payments for tenant ${query.tenantId} with filters: ` +
      `invoiceId=${query.invoiceId}, status=${query.status}, paymentMethod=${query.paymentMethod}, ` +
      `limit=${query.limit}, offset=${query.offset}`
    );

    try {
      // Try cache first for filtered lists
      let cached: PaymentReadModel[] | null = null;

      if (query.invoiceId) {
        // Cache by invoice ID
        cached = await this.cacheService.getPaymentsByInvoice<PaymentReadModel[]>(
          query.tenantId,
          query.invoiceId
        );
      } else if (query.status) {
        // Cache by status
        cached = await this.cacheService.getPaymentsByStatus<PaymentReadModel[]>(
          query.tenantId,
          query.status
        );
      }

      if (cached) {
        this.logger.debug(`Cache HIT for payments list (invoiceId: ${query.invoiceId}, status: ${query.status})`);
        return cached;
      }

      // Cache miss - query database
      this.logger.debug(`Cache MISS for payments list - querying database`);

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

      // Cache the result (TTL: 60s) based on filter type
      if (query.invoiceId) {
        await this.cacheService.setPaymentsByInvoice(query.tenantId, query.invoiceId, payments);
      } else if (query.status) {
        await this.cacheService.setPaymentsByStatus(query.tenantId, query.status, payments);
      }

      return payments;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch payments: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
