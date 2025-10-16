import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CreateJournalCommand } from '../create-journal.command';
import { IJournalEntryRepository } from '../../../domain/repositories/journal-entry.repository.interface';
import {
  JournalEntry,
  JournalLineDto,
} from '../../../domain/aggregates/journal/journal-entry.aggregate';
import { TenantId, AccountId } from '../../../domain/aggregates/chart-of-account/chart-of-account.aggregate';
import { Money } from '../../../domain/value-objects/money.value-object';
import { UserId } from '../../../domain/aggregates/invoice/invoice.aggregate';

/**
 * Create Journal Command Handler
 *
 * Handles the creation of journal entries using CQRS pattern with event sourcing.
 * Creates a JournalEntry aggregate, validates double-entry bookkeeping,
 * persists to EventStore, and publishes domain events to Kafka.
 *
 * Business Logic:
 * - Converts input lines to domain DTOs with Money value objects
 * - Creates JournalEntry aggregate (generates journal number, fiscal period)
 * - Validates double-entry bookkeeping (debits = credits)
 * - Auto-posts journal if requested and balanced
 * - Saves events to EventStore
 * - Publishes events to Kafka for projections and cross-service communication
 *
 * Events Published:
 * - JournalCreatedEvent (always)
 * - JournalLineAddedEvent (for each line)
 * - JournalValidatedEvent (if lines provided)
 * - JournalPostedEvent (if autoPost and balanced)
 *
 * Bangladesh Features:
 * - Fiscal period calculation (July-June fiscal year)
 * - Journal number generation per type (GJ, SJ, PJ, etc.)
 * - Multi-currency support (default BDT)
 */
@CommandHandler(CreateJournalCommand)
export class CreateJournalHandler implements ICommandHandler<CreateJournalCommand> {
  private readonly logger = new Logger(CreateJournalHandler.name);

  constructor(
    @Inject('IJournalEntryRepository')
    private readonly repository: IJournalEntryRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateJournalCommand): Promise<string> {
    this.logger.log(
      `Creating journal entry for ${command.journalDate.toISOString().slice(0, 10)} ` +
      `with ${command.lines.length} lines (tenant: ${command.tenantId})`
    );

    try {
      // Convert input lines to domain DTOs
      const lines: JournalLineDto[] = command.lines.map(line => ({
        accountId: new AccountId(line.accountId),
        debitAmount: line.debitAmount ? Money.create(line.debitAmount, 'BDT') : Money.zero('BDT'),
        creditAmount: line.creditAmount ? Money.create(line.creditAmount, 'BDT') : Money.zero('BDT'),
        description: line.description,
        costCenter: line.costCenter,
        project: line.project,
        reference: line.reference,
        taxCode: line.taxCode,
      }));

      // Create journal aggregate
      const journal = JournalEntry.create({
        journalDate: command.journalDate,
        journalType: command.journalType,
        description: command.description,
        reference: command.reference,
        tenantId: new TenantId(command.tenantId),
        lines,
        autoPost: command.autoPost,
      });

      // Save to EventStore
      await this.repository.save(journal);

      // Publish domain events
      const events = journal.getUncommittedEvents();
      this.logger.log(
        `Publishing ${events.length} events for journal ${journal.getId().value} ` +
        `(type: ${command.journalType || 'GENERAL'}, autoPost: ${command.autoPost || false})`
      );

      for (const event of events) {
        this.eventBus.publish(event);
      }

      const journalId = journal.getId().value;
      this.logger.log(
        `Journal created successfully: ${journalId} ` +
        `(number: ${journal.getJournalNumber()}, status: ${journal.getStatus()})`
      );

      return journalId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create journal: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
