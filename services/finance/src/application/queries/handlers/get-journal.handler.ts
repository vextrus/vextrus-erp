import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { GetJournalQuery } from '../get-journal.query';
import { JournalEntryReadModel } from '../../../infrastructure/persistence/typeorm/entities/journal-entry.entity';

/**
 * Get Journal Query Handler
 *
 * Retrieves a single journal entry by ID from the read model (PostgreSQL).
 * Returns complete journal details including all lines from JSONB column.
 *
 * CQRS Read Side:
 * - Queries PostgreSQL read model (not EventStore)
 * - Single query with no joins (lines in JSONB)
 * - Fast retrieval optimized for GraphQL
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
  ) {}

  async execute(query: GetJournalQuery): Promise<JournalEntryReadModel | null> {
    this.logger.debug(`Fetching journal ${query.journalId}`);

    try {
      const journal = await this.repository.findOne({
        where: { id: query.journalId },
      });

      if (!journal) {
        this.logger.debug(`Journal not found: ${query.journalId}`);
        return null;
      }

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
