import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { AddJournalLineCommand } from '../add-journal-line.command';
import { IJournalEntryRepository } from '../../../domain/repositories/journal-entry.repository.interface';
import {
  JournalEntry,
  JournalLineDto,
  JournalStatus,
} from '../../../domain/aggregates/journal/journal-entry.aggregate';
import { AccountId } from '../../../domain/aggregates/chart-of-account/chart-of-account.aggregate';
import { Money } from '../../../domain/value-objects/money.value-object';

/**
 * Add Journal Line Command Handler
 *
 * Handles adding a line to an existing DRAFT journal entry.
 * Loads journal from EventStore, adds line, saves events, and publishes.
 *
 * Business Logic:
 * - Loads journal aggregate from EventStore by replaying events
 * - Validates journal is in DRAFT status (cannot add lines to posted journals)
 * - Adds journal line with proper validation
 * - Saves events to EventStore
 * - Publishes JournalLineAddedEvent to Kafka
 *
 * Events Published:
 * - JournalLineAddedEvent
 *
 * Note: Adding a line doesn't automatically post the journal.
 * The journal must be explicitly posted via PostJournalCommand.
 */
@CommandHandler(AddJournalLineCommand)
export class AddJournalLineHandler implements ICommandHandler<AddJournalLineCommand> {
  private readonly logger = new Logger(AddJournalLineHandler.name);

  constructor(
    @Inject('IJournalEntryRepository')
    private readonly repository: IJournalEntryRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AddJournalLineCommand): Promise<void> {
    this.logger.log(
      `Adding line to journal ${command.journalId} ` +
      `(account: ${command.accountId}, debit: ${command.debitAmount || 0}, credit: ${command.creditAmount || 0})`
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
          `Cannot add line to journal in ${journal.getStatus()} status. Only DRAFT journals can be modified.`
        );
      }

      // Convert to domain DTO
      const lineDto: JournalLineDto = {
        accountId: new AccountId(command.accountId),
        debitAmount: command.debitAmount ? Money.create(command.debitAmount, 'BDT') : Money.zero('BDT'),
        creditAmount: command.creditAmount ? Money.create(command.creditAmount, 'BDT') : Money.zero('BDT'),
        description: command.description,
        costCenter: command.costCenter,
        project: command.project,
        reference: command.reference,
        taxCode: command.taxCode,
      };

      // Add journal line (domain validation happens here)
      journal.addJournalLine(lineDto);

      // Save to EventStore
      await this.repository.save(journal);

      // Publish domain events
      const events = journal.getUncommittedEvents();
      this.logger.log(`Publishing ${events.length} events for journal ${command.journalId}`);

      for (const event of events) {
        this.eventBus.publish(event);
      }

      this.logger.log(`Journal line added successfully to ${command.journalId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to add journal line: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
