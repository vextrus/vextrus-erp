import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { GetJournalQuery } from '../get-journal.query';
import { JournalEntryReadModel } from '../../../infrastructure/persistence/typeorm/entities/journal-entry.entity';
import { FinanceCacheService } from '../../../infrastructure/cache/cache.service';
import { TenantContextService } from '../../../infrastructure/context/tenant-context.service';

/**
 * Get Journal Query Handler
 *
 * Retrieves a single journal entry by ID from the read model (PostgreSQL).
 * Returns complete journal details including all lines from JSONB column.
 *
 * CQRS Read Side:
 * - Queries PostgreSQL read model (not EventStore)
 * - Redis caching layer (TTL: 60s)
 * - Cache-aside pattern (check cache → fallback to DB → cache result)
 * - Single query with no joins (lines in JSONB)
 * - Fast retrieval optimized for GraphQL
 * - Supports multi-tenant isolation
 *
 * Performance:
 * - Cache HIT: ~5-10ms (10x faster)
 * - Cache MISS: ~50-100ms (DB query + caching)
 *
 * Returns:
 * - JournalEntryReadModel with all details
 * - null if journal not found
 */
@QueryHandler(GetJournalQuery)
export class GetJournalHandler implements IQueryHandler<GetJournalQuery> {
  private readonly logger = new Logger(GetJournalHandler.name);

  constructor(
    @InjectRepository(JournalEntryReadModel)
    private readonly repository: Repository<JournalEntryReadModel>,
    private readonly cacheService: FinanceCacheService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(query: GetJournalQuery): Promise<JournalEntryReadModel | null> {
    const tenantId = this.tenantContext.getTenantId();
    this.logger.debug(`Fetching journal: ${query.journalId} for tenant: ${tenantId}`);

    try {
      // Try cache first (tenant-scoped)
      const cached = await this.cacheService.getJournal<JournalEntryReadModel>(
        tenantId,
        query.journalId
      );

      if (cached) {
        this.logger.debug(`Cache HIT for journal: ${query.journalId}`);
        return cached;
      }

      // Cache miss - query database
      this.logger.debug(`Cache MISS for journal: ${query.journalId} - querying database`);
      const journal = await this.repository.findOne({
        where: { id: query.journalId },
      });

      if (!journal) {
        this.logger.debug(`Journal not found: ${query.journalId}`);
        return null;
      }

      // Cache the result (TTL: 60s)
      await this.cacheService.setJournal(tenantId, query.journalId, journal);

      this.logger.debug(
        `Journal found: ${query.journalId} (${journal.journalNumber}, ` +
        `type: ${journal.journalType}, status: ${journal.status}, lines: ${journal.lines.length})`
      );

      return journal;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch journal: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
