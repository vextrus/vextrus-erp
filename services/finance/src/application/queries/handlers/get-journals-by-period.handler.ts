import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { GetJournalsByPeriodQuery } from '../get-journals-by-period.query';
import { JournalEntryReadModel } from '../../../infrastructure/persistence/typeorm/entities/journal-entry.entity';

/**
 * Get Journals By Period Query Handler
 *
 * Retrieves all journal entries for a specific fiscal period.
 * Used for period-end closing, reporting, and reconciliation.
 *
 * Fiscal Period Format:
 * - FY2024-2025-P01 (July = P01)
 * - FY2024-2025-P12 (June = P12)
 * - Bangladesh fiscal year: July 1 to June 30
 *
 * Ordering:
 * - journalDate ASC (chronological)
 * - journalNumber ASC (secondary order)
 *
 * Use Cases:
 * - Period-end closing workflows
 * - Monthly financial reports
 * - Trial balance generation
 * - Fiscal year-end audit preparation
 *
 * CQRS Read Side:
 * - Queries PostgreSQL read model
 * - Filtered by fiscalPeriod index (optimized)
 * - Returns all journal types for period
 */
@QueryHandler(GetJournalsByPeriodQuery)
export class GetJournalsByPeriodHandler implements IQueryHandler<GetJournalsByPeriodQuery> {
  private readonly logger = new Logger(GetJournalsByPeriodHandler.name);

  constructor(
    @InjectRepository(JournalEntryReadModel)
    private readonly repository: Repository<JournalEntryReadModel>,
  ) {}

  async execute(query: GetJournalsByPeriodQuery): Promise<JournalEntryReadModel[]> {
    this.logger.debug(
      `Fetching journals for period ${query.fiscalPeriod}, tenant ${query.tenantId} ` +
      `(limit: ${query.limit}, offset: ${query.offset})`
    );

    try {
      const journals = await this.repository.find({
        where: {
          tenantId: query.tenantId,
          fiscalPeriod: query.fiscalPeriod,
        },
        order: {
          journalDate: 'ASC',
          journalNumber: 'ASC',
        },
        skip: query.offset,
        take: query.limit,
      });

      this.logger.debug(
        `Found ${journals.length} journals for period ${query.fiscalPeriod} ` +
        `(tenant: ${query.tenantId})`
      );

      // Log summary by type and status for debugging
      const summary = journals.reduce((acc, j) => {
        const key = `${j.journalType}-${j.status}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      this.logger.debug(`Period ${query.fiscalPeriod} summary: ${JSON.stringify(summary)}`);

      return journals;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch journals by period: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
