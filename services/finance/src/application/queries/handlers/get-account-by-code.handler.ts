import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetAccountByCodeQuery } from '../get-account-by-code.query';
import { ChartOfAccountDto } from '../../../presentation/graphql/dto/chart-of-account.dto';
import { MoneyDto } from '../../../presentation/graphql/dto/money.dto';
import { ChartOfAccountReadModel } from '../../../infrastructure/persistence/typeorm/entities/chart-of-account.entity';
import { AccountType } from '../../../presentation/graphql/dto/enums.dto';

/**
 * Get Account By Code Query Handler
 *
 * Handles retrieval of a single chart of account by account code from the read model (PostgreSQL).
 * Account codes are unique per tenant.
 * Maps the read model entity to ChartOfAccountDto for GraphQL response.
 *
 * CQRS Query Side:
 * - Reads from optimized PostgreSQL read model
 * - No business logic execution
 * - Fast, indexed queries (unique index on tenantId + accountCode)
 * - Multi-tenant isolation enforced
 *
 * Bangladesh Compliance:
 * - Account code format validated: XXXX or XXXX-YY-ZZ
 * - Hierarchical account structure supported
 */
@QueryHandler(GetAccountByCodeQuery)
export class GetAccountByCodeHandler implements IQueryHandler<GetAccountByCodeQuery> {
  private readonly logger = new Logger(GetAccountByCodeHandler.name);

  constructor(
    @InjectRepository(ChartOfAccountReadModel)
    private readonly readRepository: Repository<ChartOfAccountReadModel>,
  ) {}

  async execute(query: GetAccountByCodeQuery): Promise<ChartOfAccountDto | null> {
    this.logger.debug(`Fetching account by code: ${query.accountCode} for tenant ${query.tenantId}`);

    const account = await this.readRepository.findOne({
      where: {
        accountCode: query.accountCode,
        tenantId: query.tenantId,
      },
    });

    if (!account) {
      this.logger.debug(`Account with code ${query.accountCode} not found for tenant ${query.tenantId}`);
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
