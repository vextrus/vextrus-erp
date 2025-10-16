import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { GetJournalsQuery } from '../get-journals.query';
import { JournalEntryReadModel } from '../../../infrastructure/persistence/typeorm/entities/journal-entry.entity';

/**
 * Get Journals Query Handler
 *
 * Retrieves multiple journal entries with optional filters and pagination.
 * Supports filtering by type, status, and fiscal period.
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
 *
 * CQRS Read Side:
 * - Queries PostgreSQL read model with indexes
 * - Fast filtering and pagination
 * - Optimized for list views in UI
 */
@QueryHandler(GetJournalsQuery)
export class GetJournalsHandler implements IQueryHandler<GetJournalsQuery> {
  private readonly logger = new Logger(GetJournalsHandler.name);

  constructor(
    @InjectRepository(JournalEntryReadModel)
    private readonly repository: Repository<JournalEntryReadModel>,
  ) {}

  async execute(query: GetJournalsQuery): Promise<JournalEntryReadModel[]> {
    this.logger.debug(
      `Fetching journals for tenant ${query.tenantId} ` +
      `(type: ${query.journalType || 'all'}, status: ${query.status || 'all'}, ` +
      `period: ${query.fiscalPeriod || 'all'}, limit: ${query.limit}, offset: ${query.offset})`
    );

    try {
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

      return journals;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch journals: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
