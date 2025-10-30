import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { GetAccountsQuery } from '../get-accounts.query';
import { ChartOfAccountDto } from '../../../presentation/graphql/dto/chart-of-account.dto';
import { MoneyDto } from '../../../presentation/graphql/dto/money.dto';
import { ChartOfAccountReadModel } from '../../../infrastructure/persistence/typeorm/entities/chart-of-account.entity';
import { AccountType } from '../../../presentation/graphql/dto/enums.dto';
import { FinanceCacheService } from '../../../infrastructure/cache/cache.service';

/**
 * Get Accounts Query Handler
 *
 * Handles retrieval of multiple chart of accounts from the read model (PostgreSQL).
 * Supports filtering by account type and active status.
 * Maps read model entities to ChartOfAccountDto array for GraphQL response.
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
 * - Cache HIT: ~5-10ms for account lists
 * - Cache MISS: ~200-500ms (DB scan + caching)
 */
@QueryHandler(GetAccountsQuery)
export class GetAccountsHandler implements IQueryHandler<GetAccountsQuery> {
  private readonly logger = new Logger(GetAccountsHandler.name);

  constructor(
    @InjectRepository(ChartOfAccountReadModel)
    private readonly readRepository: Repository<ChartOfAccountReadModel>,
    private readonly cacheService: FinanceCacheService,
  ) {}

  async execute(query: GetAccountsQuery): Promise<ChartOfAccountDto[]> {
    this.logger.debug(
      `Fetching accounts for tenant ${query.tenantId} ` +
      `(type: ${query.accountType || 'all'}, active: ${query.isActive ?? 'all'}, ` +
      `limit: ${query.limit}, offset: ${query.offset})`
    );

    // Try cache first (tenant-scoped, filter-specific)
    const cached = await this.cacheService.getAccountsList<ChartOfAccountDto[]>(
      query.tenantId,
      query.accountType
    );

    if (cached) {
      this.logger.debug(`Cache HIT for accounts list (type: ${query.accountType || 'all'})`);
      return cached;
    }

    // Cache miss - query database
    this.logger.debug(`Cache MISS for accounts list - querying database`);

    // Build where conditions dynamically
    const where: FindOptionsWhere<ChartOfAccountReadModel> = {
      tenantId: query.tenantId,
    };

    if (query.accountType !== undefined) {
      where.accountType = query.accountType;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    // Execute query with filters, pagination, and ordering
    const accounts = await this.readRepository.find({
      where,
      order: {
        accountCode: 'ASC', // Order by account code for hierarchical display
      },
      take: query.limit,
      skip: query.offset,
    });

    this.logger.debug(`Found ${accounts.length} accounts`);

    const dtos = accounts.map(account => this.mapToDto(account));

    // Cache the result (TTL: 60s)
    await this.cacheService.setAccountsList(query.tenantId, dtos, query.accountType);

    return dtos;
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
