import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetAccountQuery } from '../get-account.query';
import { ChartOfAccountDto } from '../../../presentation/graphql/dto/chart-of-account.dto';
import { MoneyDto } from '../../../presentation/graphql/dto/money.dto';
import { ChartOfAccountReadModel } from '../../../infrastructure/persistence/typeorm/entities/chart-of-account.entity';
import { AccountType } from '../../../presentation/graphql/dto/enums.dto';

/**
 * Get Account Query Handler
 *
 * Handles retrieval of a single chart of account by ID from the read model (PostgreSQL).
 * Maps the read model entity to ChartOfAccountDto for GraphQL response.
 *
 * CQRS Query Side:
 * - Reads from optimized PostgreSQL read model
 * - No business logic execution
 * - Fast, indexed queries
 * - Supports multi-tenant isolation
 */
@QueryHandler(GetAccountQuery)
export class GetAccountHandler implements IQueryHandler<GetAccountQuery> {
  private readonly logger = new Logger(GetAccountHandler.name);

  constructor(
    @InjectRepository(ChartOfAccountReadModel)
    private readonly readRepository: Repository<ChartOfAccountReadModel>,
  ) {}

  async execute(query: GetAccountQuery): Promise<ChartOfAccountDto | null> {
    this.logger.debug(`Fetching account: ${query.accountId}`);

    const account = await this.readRepository.findOne({
      where: { id: query.accountId },
    });

    if (!account) {
      this.logger.debug(`Account ${query.accountId} not found`);
      return null;
    }

    return this.mapToDto(account);
  }

  /**
   * Maps ChartOfAccountReadModel entity to ChartOfAccountDto
   * Converts database types to GraphQL-compatible DTOs
   */
  private mapToDto(entity: ChartOfAccountReadModel): ChartOfAccountDto {
    return {
      id: entity.id,
      accountCode: entity.accountCode,
      accountName: entity.accountName,
      accountType: entity.accountType as AccountType,
      parentAccountId: entity.parentAccountId || undefined,
      balance: this.createMoneyDto(Number(entity.balance), entity.currency),
      currency: entity.currency,
      isActive: entity.isActive,
      tenantId: entity.tenantId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Creates MoneyDto with formatted amount
   * Formats according to currency convention
   * - BDT: ৳ symbol with Bengali locale
   * - Others: Standard currency code
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
