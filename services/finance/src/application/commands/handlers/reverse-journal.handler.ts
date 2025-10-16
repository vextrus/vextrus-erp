import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReverseJournalCommand } from '../reverse-journal.command';
import { IJournalEntryRepository } from '../../../domain/repositories/journal-entry.repository.interface';
import { JournalEntry, JournalStatus } from '../../../domain/aggregates/journal/journal-entry.aggregate';

/**
 * Reverse Journal Command Handler
 *
 * Handles creation of reversing journal entries for posted journals.
 * Creates a new journal with debits and credits swapped to reverse the effect.
 *
 * Business Logic:
 * - Loads original journal from EventStore
 * - Validates journal is POSTED
 * - Creates reversing journal via aggregate.createReversingEntry()
 * - Reversing journal has swapped debits/credits
 * - Original journal status updated to REVERSED
 * - Both journals linked (originalJournalId/reversingJournalId)
 * - Saves both journals to EventStore
 * - Publishes events to Kafka
 *
 * Events Published:
 * - ReversingJournalCreatedEvent
 * - JournalCreatedEvent (for reversing journal)
 * - JournalPostedEvent (reversing journal auto-posted)
 *
 * Use Cases:
 * - Correcting errors in posted journals
 * - Reversing accruals
 * - Period-end adjustments
 * - Closing entry corrections
 *
 * Bangladesh Compliance:
 * - Validates reversing date in open fiscal period (July-June)
 * - Maintains complete audit trail
 * - Journal number format: RJ-YYYY-MM-NNNNNN
 * - Reference includes original journal number (REV-{original})
 *
 * Returns: Reversing journal ID
 */
@CommandHandler(ReverseJournalCommand)
export class ReverseJournalHandler implements ICommandHandler<ReverseJournalCommand> {
  private readonly logger = new Logger(ReverseJournalHandler.name);

  constructor(
    @Inject('IJournalEntryRepository')
    private readonly repository: IJournalEntryRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ReverseJournalCommand): Promise<string> {
    this.logger.log(
      `Reversing journal ${command.journalId} with date ${command.reversingDate.toISOString().slice(0, 10)} ` +
      `by user ${command.userId} (tenant: ${command.tenantId})`
    );

    try {
      // Load original journal from EventStore
      const originalJournal = await this.repository.findById(command.journalId, command.tenantId);

      if (!originalJournal) {
        throw new NotFoundException(`Journal ${command.journalId} not found`);
      }

      // Validate journal is POSTED
      if (originalJournal.getStatus() !== JournalStatus.POSTED) {
        throw new BadRequestException(
          `Cannot reverse journal in ${originalJournal.getStatus()} status. ` +
          `Only POSTED journals can be reversed.`
        );
      }

      // Create reversing journal (domain logic handles swapping debits/credits)
      const reversingJournal = originalJournal.createReversingEntry(command.reversingDate);

      // Save both journals to EventStore
      await this.repository.save(originalJournal); // Original journal status updated to REVERSED
      await this.repository.save(reversingJournal); // New reversing journal saved

      // Publish domain events for original journal
      const originalEvents = originalJournal.getUncommittedEvents();
      this.logger.log(`Publishing ${originalEvents.length} events for original journal ${command.journalId}`);

      for (const event of originalEvents) {
        this.eventBus.publish(event);
      }

      // Publish domain events for reversing journal
      const reversingEvents = reversingJournal.getUncommittedEvents();
      this.logger.log(
        `Publishing ${reversingEvents.length} events for reversing journal ${reversingJournal.getId().value}`
      );

      for (const event of reversingEvents) {
        this.eventBus.publish(event);
      }

      const reversingJournalId = reversingJournal.getId().value;
      this.logger.log(
        `Journal reversed successfully. Original: ${command.journalId} (${originalJournal.getJournalNumber()}), ` +
        `Reversing: ${reversingJournalId} (${reversingJournal.getJournalNumber()})`
      );

      return reversingJournalId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to reverse journal: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
