import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PostJournalCommand } from '../post-journal.command';
import { IJournalEntryRepository } from '../../../domain/repositories/journal-entry.repository.interface';
import { JournalEntry, JournalStatus } from '../../../domain/aggregates/journal/journal-entry.aggregate';
import { UserId } from '../../../domain/aggregates/invoice/invoice.aggregate';

/**
 * Post Journal Command Handler
 *
 * Handles posting of journal entries, making them immutable and affecting account balances.
 * Validates double-entry bookkeeping before posting.
 *
 * Business Logic:
 * - Loads journal from EventStore by replaying events
 * - Validates journal is in DRAFT status
 * - Validates double-entry bookkeeping (debits = credits)
 * - Posts journal (calls domain aggregate.post() method)
 * - Saves events to EventStore
 * - Publishes JournalPostedEvent to Kafka
 *
 * Events Published:
 * - JournalPostedEvent
 *
 * Effects:
 * - Journal status changes to POSTED
 * - Journal becomes immutable (cannot add lines or modify)
 * - Posted timestamp and user recorded
 * - Account balances updated (via event projections)
 * - Fiscal period finalized
 *
 * Validation:
 * - Journal must have at least 2 lines
 * - Total debits must equal total credits
 * - Journal date must be in open accounting period
 * - All accounts must be valid and active
 *
 * Bangladesh Compliance:
 * - Validates fiscal period is open (July-June fiscal year)
 * - Records posting for audit trail
 * - Prevents posting to closed periods
 */
@CommandHandler(PostJournalCommand)
export class PostJournalHandler implements ICommandHandler<PostJournalCommand> {
  private readonly logger = new Logger(PostJournalHandler.name);

  constructor(
    @Inject('IJournalEntryRepository')
    private readonly repository: IJournalEntryRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: PostJournalCommand): Promise<void> {
    this.logger.log(
      `Posting journal ${command.journalId} by user ${command.postedBy} (tenant: ${command.tenantId})`
    );

    try {
      // Load journal from EventStore
      const journal = await this.repository.findById(command.journalId, command.tenantId);

      if (!journal) {
        throw new NotFoundException(`Journal ${command.journalId} not found`);
      }

      // Validate journal is in DRAFT status
      if (journal.getStatus() !== JournalStatus.DRAFT) {
        throw new BadRequestException(
          `Cannot post journal in ${journal.getStatus()} status. Only DRAFT journals can be posted.`
        );
      }

      // Post journal (domain validation happens here)
      // This will validate balance and throw if not balanced
      journal.post(new UserId(command.postedBy));

      // Save to EventStore
      await this.repository.save(journal);

      // Publish domain events
      const events = journal.getUncommittedEvents();
      this.logger.log(`Publishing ${events.length} events for journal ${command.journalId}`);

      for (const event of events) {
        this.eventBus.publish(event);
      }

      this.logger.log(
        `Journal posted successfully: ${command.journalId} ` +
        `(number: ${journal.getJournalNumber()}, ` +
        `debit: ${journal.getTotalDebit().getAmount()}, ` +
        `credit: ${journal.getTotalCredit().getAmount()})`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to post journal: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
