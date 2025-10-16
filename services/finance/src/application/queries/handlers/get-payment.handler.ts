import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { GetPaymentQuery } from '../get-payment.query';
import { PaymentReadModel } from '../../../infrastructure/persistence/typeorm/entities/payment.entity';

/**
 * Get Payment Query Handler
 *
 * Retrieves a single payment by ID from the read model (PostgreSQL).
 * Returns payment details for GraphQL queries.
 *
 * Returns:
 * - Payment DTO with all details
 * - null if payment not found
 */
@QueryHandler(GetPaymentQuery)
export class GetPaymentHandler implements IQueryHandler<GetPaymentQuery> {
  private readonly logger = new Logger(GetPaymentHandler.name);

  constructor(
    @InjectRepository(PaymentReadModel)
    private readonly repository: Repository<PaymentReadModel>,
  ) {}

  async execute(query: GetPaymentQuery): Promise<PaymentReadModel | null> {
    this.logger.debug(`Fetching payment ${query.paymentId}`);

    try {
      const payment = await this.repository.findOne({
        where: { id: query.paymentId },
      });

      if (!payment) {
        this.logger.debug(`Payment not found: ${query.paymentId}`);
        return null;
      }

      this.logger.debug(`Payment found: ${query.paymentId}`);
      return payment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch payment: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
