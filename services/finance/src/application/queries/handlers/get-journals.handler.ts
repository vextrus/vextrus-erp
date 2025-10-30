import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { GetJournalsQuery } from '../get-journals.query';
import { JournalEntryReadModel } from '../../../infrastructure/persistence/typeorm/entities/journal-entry.entity';
import { FinanceCacheService } from '../../../infrastructure/cache/cache.service';

/**
 * Get Journals Query Handler
 *
 * Retrieves multiple journal entries with optional filters and pagination.
 * Supports filtering by type, status, and fiscal period.
 *
 * CQRS Read Side:
 * - Queries PostgreSQL read model with indexes
 * - Redis caching layer (TTL: 60s)
 * - Cache-aside pattern with filter-specific keys
 * - Fast filtering and pagination
 * - Multi-tenant isolation enforced
 * - Optimized for list views in UI
 *
 * Performance:
 * - Cache HIT: ~5-10ms for journal lists
 * - Cache MISS: ~200-500ms (DB scan + caching)
 *
 * Filters:
 * - journalType: GENERAL, SALES, PURCHASE, etc.
 * - status: DRAFT, POSTED, REVERSED, etc.
 * - fiscalPeriod: FY2024-2025-P01 format
 * - tenantId: Multi-tenant isolation (required)
 *
 * Ordering:
 * - journalDate DESC (newest first)
 * - journalNumber DESC (secondary order)
 */
@QueryHandler(GetJournalsQuery)
export class GetJournalsHandler implements IQueryHandler<GetJournalsQuery> {
  private readonly logger = new Logger(GetJournalsHandler.name);

  constructor(
    @InjectRepository(JournalEntryReadModel)
    private readonly repository: Repository<JournalEntryReadModel>,
    private readonly cacheService: FinanceCacheService,
  ) {}

  async execute(query: GetJournalsQuery): Promise<JournalEntryReadModel[]> {
    this.logger.debug(
      `Fetching journals for tenant ${query.tenantId} ` +
      `(type: ${query.journalType || 'all'}, status: ${query.status || 'all'}, ` +
      `period: ${query.fiscalPeriod || 'all'}, limit: ${query.limit}, offset: ${query.offset})`
    );

    try {
      // Try cache first for filtered lists
      let cached: JournalEntryReadModel[] | null = null;

      if (query.fiscalPeriod) {
        // Cache by fiscal period
        cached = await this.cacheService.getJournalsByPeriod<JournalEntryReadModel[]>(
          query.tenantId,
          query.fiscalPeriod
        );
      } else if (query.status === 'DRAFT') {
        // Cache unposted journals (common query)
        cached = await this.cacheService.getUnpostedJournals<JournalEntryReadModel[]>(
          query.tenantId
        );
      }

      if (cached) {
        this.logger.debug(
          `Cache HIT for journals list (period: ${query.fiscalPeriod}, status: ${query.status})`
        );
        return cached;
      }

      // Cache miss - query database
      this.logger.debug(`Cache MISS for journals list - querying database`);

      // Build query with optional filters
      const queryBuilder = this.repository
        .createQueryBuilder('journal')
        .where('journal.tenantId = :tenantId', { tenantId: query.tenantId });

      // Optional filters
      if (query.journalType) {
        queryBuilder.andWhere('journal.journalType = :journalType', {
          journalType: query.journalType,
        });
      }

      if (query.status) {
        queryBuilder.andWhere('journal.status = :status', {
          status: query.status,
        });
      }

      if (query.fiscalPeriod) {
        queryBuilder.andWhere('journal.fiscalPeriod = :fiscalPeriod', {
          fiscalPeriod: query.fiscalPeriod,
        });
      }

      // Ordering and pagination
      const journals = await queryBuilder
        .orderBy('journal.journalDate', 'DESC')
        .addOrderBy('journal.journalNumber', 'DESC')
        .skip(query.offset)
        .take(query.limit)
        .getMany();

      this.logger.debug(
        `Found ${journals.length} journals for tenant ${query.tenantId} ` +
        `(filters applied: type=${!!query.journalType}, status=${!!query.status}, period=${!!query.fiscalPeriod})`
      );

      // Cache the result (TTL: 60s) based on filter type
      if (query.fiscalPeriod) {
        await this.cacheService.setJournalsByPeriod(query.tenantId, query.fiscalPeriod, journals);
      } else if (query.status === 'DRAFT') {
        await this.cacheService.setUnpostedJournals(query.tenantId, journals);
      }

      return journals;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch journals: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
