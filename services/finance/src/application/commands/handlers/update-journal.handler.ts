import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, NotFoundException } from '@nestjs/common';
import { UpdateJournalCommand } from '../update-journal.command';
import { IJournalEntryRepository } from '../../../domain/repositories/journal-entry.repository.interface';
import { UserId } from '../../../domain/aggregates/invoice/invoice.aggregate';

/**
 * Update Journal Entry Handler
 *
 * Handles the UpdateJournalCommand using CQRS pattern with event sourcing.
 * Only DRAFT journals can be updated. POSTED, REVERSED, or CANCELLED journals
 * are immutable and must be reversed instead.
 *
 * Business Rules:
 * - Only DRAFT status journals can be updated
 * - All fields are optional (partial updates supported)
 * - Journal must remain balanced (debits = credits) after update
 * - Updated journal events are emitted for event sourcing
 * - Fiscal period recalculated if journalDate changes
 *
 * Bangladesh Compliance:
 * - Fiscal year validation (July-June)
 * - Double-entry bookkeeping enforced
 * - Journal balance validation (debits must equal credits)
 */
@CommandHandler(UpdateJournalCommand)
export class UpdateJournalHandler implements ICommandHandler<UpdateJournalCommand> {
  private readonly logger = new Logger(UpdateJournalHandler.name);

  constructor(
    private readonly journalRepository: IJournalEntryRepository,
  ) {}

  async execute(command: UpdateJournalCommand): Promise<string> {
    this.logger.log(`Updating journal ${command.journalId}`);

    // Load journal aggregate from event store
    const journal = await this.journalRepository.findById(command.journalId, command.tenantId);
    if (!journal) {
      throw new NotFoundException(`Journal ${command.journalId} not found`);
    }

    const userId = new UserId(command.userId);

    // Apply updates (each method validates DRAFT status)
    if (command.description !== undefined) {
      journal.updateDescription(command.description, userId);
    }

    if (command.reference !== undefined) {
      journal.updateReference(command.reference, userId);
    }

    if (command.journalDate !== undefined) {
      journal.updateJournalDate(command.journalDate, userId);
    }

    if (command.lines !== undefined) {
      journal.updateLines(command.lines, userId);
    }

    // Save journal (persists events to EventStore)
    await this.journalRepository.save(journal);

    // Publish domain events via repository
    // Events will be projected to read models by ProjectionHandlers

    this.logger.log(`Journal ${command.journalId} updated successfully`);
    return command.journalId;
  }
}
