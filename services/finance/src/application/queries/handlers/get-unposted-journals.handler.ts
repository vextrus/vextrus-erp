import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { GetUnpostedJournalsQuery } from '../get-unposted-journals.query';
import { JournalEntryReadModel } from '../../../infrastructure/persistence/typeorm/entities/journal-entry.entity';

/**
 * Get Unposted Journals Query Handler
 *
 * Retrieves all DRAFT journals that have not been posted.
 * Used for validation, review, and batch posting workflows.
 *
 * Filtering:
 * - status = DRAFT (only unposted journals)
 * - tenantId (multi-tenant isolation)
 *
 * Ordering:
 * - journalDate ASC (oldest first for review)
 * - createdAt ASC (secondary order)
 *
 * Use Cases:
 * - Review pending journals before posting
 * - Batch posting workflows
 * - Validation and error checking
 * - Period-end review (unposted items report)
 * - Audit trail for unfinished work
 *
 * CQRS Read Side:
 * - Queries PostgreSQL read model
 * - Filtered by status index (optimized)
 * - Returns all journal types
 */
@QueryHandler(GetUnpostedJournalsQuery)
export class GetUnpostedJournalsHandler implements IQueryHandler<GetUnpostedJournalsQuery> {
  private readonly logger = new Logger(GetUnpostedJournalsHandler.name);

  constructor(
    @InjectRepository(JournalEntryReadModel)
    private readonly repository: Repository<JournalEntryReadModel>,
  ) {}

  async execute(query: GetUnpostedJournalsQuery): Promise<JournalEntryReadModel[]> {
    this.logger.debug(
      `Fetching unposted journals for tenant ${query.tenantId} ` +
      `(limit: ${query.limit}, offset: ${query.offset})`
    );

    try {
      const journals = await this.repository.find({
        where: {
          tenantId: query.tenantId,
          status: 'DRAFT',
        },
        order: {
          journalDate: 'ASC',
          createdAt: 'ASC',
        },
        skip: query.offset,
        take: query.limit,
      });

      this.logger.debug(
        `Found ${journals.length} unposted journals for tenant ${query.tenantId}`
      );

      // Log summary by type for debugging
      const summary = journals.reduce((acc, j) => {
        acc[j.journalType] = (acc[j.journalType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      this.logger.debug(`Unposted journals by type: ${JSON.stringify(summary)}`);

      // Log oldest unposted journal for monitoring
      if (journals.length > 0) {
        const oldest = journals[0];
        const daysSince = Math.floor(
          (Date.now() - oldest.journalDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        this.logger.debug(
          `Oldest unposted journal: ${oldest.journalNumber} ` +
          `(date: ${oldest.journalDate.toISOString().slice(0, 10)}, ${daysSince} days old)`
        );
      }

      return journals;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch unposted journals: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
