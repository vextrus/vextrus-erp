import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { DomainEvent } from '../../../domain/base/domain-event.base';
import {
  JournalCreatedEvent,
  JournalLineAddedEvent,
  JournalPostedEvent,
  ReversingJournalCreatedEvent,
  JournalValidatedEvent,
} from '../../../domain/aggregates/journal/journal-entry.aggregate';
import { JournalEntryReadModel } from '../../../infrastructure/persistence/typeorm/entities/journal-entry.entity';
import { FinanceCacheService } from '../../../infrastructure/cache/cache.service';

/**
 * Journal Projection Handler
 *
 * Projects journal entry domain events to the read model (PostgreSQL).
 * Handles all 5 journal lifecycle events for complete event sourcing.
 *
 * Events Handled:
 * 1. JournalCreatedEvent - Initial journal creation
 * 2. JournalLineAddedEvent - Line added to journal
 * 3. JournalPostedEvent - Journal posted to ledger
 * 4. ReversingJournalCreatedEvent - Reversing journal created
 * 5. JournalValidatedEvent - Journal validated (optional tracking)
 *
 * Event Sourcing + CQRS Pattern:
 * - Events stored in EventStore (write model)
 * - Events projected to PostgreSQL (read model)
 * - Read model optimized for queries
 * - Eventual consistency between write and read models
 *
 * JSONB Lines Storage:
 * - Lines stored as JSONB array for efficient querying
 * - No joins required for line retrieval
 * - Fast read performance
 * - Supports PostgreSQL JSONB operators
 *
 * Bangladesh Fiscal Year:
 * - Fiscal period calculated during journal creation
 * - Format: FY2024-2025-P01 (P01 = July, P12 = June)
 * - July 1 to June 30 fiscal year
 */
@EventsHandler(
  JournalCreatedEvent,
  JournalLineAddedEvent,
  JournalPostedEvent,
  ReversingJournalCreatedEvent,
  JournalValidatedEvent
)
export class JournalProjectionHandler implements IEventHandler<DomainEvent> {
  private readonly logger = new Logger(JournalProjectionHandler.name);

  constructor(
    @InjectRepository(JournalEntryReadModel)
    private readonly readRepository: Repository<JournalEntryReadModel>,
    private readonly cacheService: FinanceCacheService,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    try {
      if (event instanceof JournalCreatedEvent) {
        await this.handleJournalCreated(event);
      } else if (event instanceof JournalLineAddedEvent) {
        await this.handleLineAdded(event);
      } else if (event instanceof JournalPostedEvent) {
        await this.handleJournalPosted(event);
      } else if (event instanceof ReversingJournalCreatedEvent) {
        await this.handleReversingCreated(event);
      } else if (event instanceof JournalValidatedEvent) {
        await this.handleValidated(event);
      }
    } catch (error) {
      this.logger.error(`Error handling ${event.constructor.name}:`, error);
      // Don't throw - projection errors shouldn't stop the event flow
      // In production, implement event replay mechanism for failed projections
    }
  }

  /**
   * Handle JournalCreatedEvent
   * Creates initial journal record in read model with empty lines array
   */
  private async handleJournalCreated(event: JournalCreatedEvent): Promise<void> {
    this.logger.debug(
      `Projecting JournalCreatedEvent: ${event.journalId.value} ` +
      `(${event.journalNumber}, type: ${event.journalType}, period: ${event.fiscalPeriod})`
    );

    const journal = this.readRepository.create({
      id: event.journalId.value,
      tenantId: event.tenantId,
      journalNumber: event.journalNumber,
      journalDate: event.journalDate,
      journalType: event.journalType,
      description: event.description,
      reference: event.reference,
      fiscalPeriod: event.fiscalPeriod,
      status: 'DRAFT',
      lines: [], // Start with empty array, lines added via JournalLineAddedEvent
      totalDebit: 0,
      totalCredit: 0,
      currency: 'BDT',
      isReversing: false,
      createdAt: new Date(event.timestamp),
      updatedAt: new Date(event.timestamp),
    });

    await this.readRepository.save(journal);

    // Invalidate cache after successful update
    await this.cacheService.invalidateJournal(event.tenantId, event.journalId.value);
    this.logger.debug(`Invalidated cache for journal ${event.journalId.value}`);

    this.logger.debug(`Journal read model created: ${event.journalId.value}`);
  }

  /**
   * Handle JournalLineAddedEvent
   * Adds line to JSONB array and recalculates totals
   */
  private async handleLineAdded(event: JournalLineAddedEvent): Promise<void> {
    this.logger.debug(
      `Projecting JournalLineAddedEvent: ${event.journalId.value} ` +
      `(line: ${event.line.lineId.value}, account: ${event.line.accountId.value})`
    );

    const journal = await this.readRepository.findOne({
      where: { id: event.journalId.value }
    });

    if (!journal) {
      this.logger.error(
        `Journal ${event.journalId.value} not found for line addition. ` +
        `This might indicate event ordering issue.`
      );
      return;
    }

    // Add line to JSONB array
    const lines = journal.lines || [];
    lines.push({
      lineId: event.line.lineId.value,
      accountId: event.line.accountId.value,
      debitAmount: event.line.debitAmount.getAmount(),
      creditAmount: event.line.creditAmount.getAmount(),
      description: event.line.description,
      costCenter: event.line.costCenter,
      project: event.line.project,
      reference: event.line.reference,
      taxCode: event.line.taxCode,
    });

    // Recalculate totals
    const totalDebit = lines.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.creditAmount, 0);

    await this.readRepository.update(
      { id: event.journalId.value },
      {
        lines,
        totalDebit,
        totalCredit,
        updatedAt: new Date(event.timestamp),
      }
    );

    // Invalidate cache after successful update
    await this.cacheService.invalidateJournal(event.tenantId, event.journalId.value);
    this.logger.debug(`Invalidated cache for journal ${event.journalId.value}`);

    this.logger.debug(
      `Journal line added: ${event.journalId.value} ` +
      `(lines: ${lines.length}, debit: ${totalDebit}, credit: ${totalCredit})`
    );
  }

  /**
   * Handle JournalPostedEvent
   * Updates journal status to POSTED with posting metadata
   */
  private async handleJournalPosted(event: JournalPostedEvent): Promise<void> {
    this.logger.debug(
      `Projecting JournalPostedEvent: ${event.journalId.value} ` +
      `(postedBy: ${event.postedBy.value}, debit: ${event.totalDebit.getAmount()}, ` +
      `credit: ${event.totalCredit.getAmount()})`
    );

    await this.readRepository.update(
      { id: event.journalId.value },
      {
        status: 'POSTED',
        postedAt: event.postedAt,
        postedBy: event.postedBy.value,
        // Update totals from event (final validation)
        totalDebit: event.totalDebit.getAmount(),
        totalCredit: event.totalCredit.getAmount(),
        updatedAt: new Date(event.timestamp),
      }
    );

    // Invalidate cache after successful update
    await this.cacheService.invalidateJournal(event.tenantId, event.journalId.value);
    this.logger.debug(`Invalidated cache for journal ${event.journalId.value}`);

    this.logger.debug(`Journal posted: ${event.journalId.value}`);
  }

  /**
   * Handle ReversingJournalCreatedEvent
   * Creates new reversing journal and updates original journal status
   */
  private async handleReversingCreated(event: ReversingJournalCreatedEvent): Promise<void> {
    this.logger.debug(
      `Projecting ReversingJournalCreatedEvent: original ${event.originalJournalId.value}, ` +
      `reversing ${event.reversingJournalId.value} (date: ${event.reversingDate.toISOString().slice(0, 10)})`
    );

    // Create reversing journal with swapped debits/credits
    const lines = event.lines.map(line => ({
      lineId: line.lineId.value,
      accountId: line.accountId.value,
      debitAmount: line.debitAmount.getAmount(),
      creditAmount: line.creditAmount.getAmount(),
      description: line.description,
      costCenter: line.costCenter,
      project: line.project,
      reference: line.reference,
      taxCode: line.taxCode,
    }));

    // Calculate totals
    const totalDebit = lines.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.creditAmount, 0);

    // Calculate fiscal period for reversing date (Bangladesh July-June fiscal year)
    const fiscalPeriod = this.calculateFiscalPeriod(event.reversingDate);

    const reversingJournal = this.readRepository.create({
      id: event.reversingJournalId.value,
      tenantId: event.tenantId,
      journalNumber: `RJ-${event.reversingDate.toISOString().slice(0, 10)}-PENDING`, // Will be updated by JournalCreatedEvent
      journalDate: event.reversingDate,
      journalType: 'REVERSING',
      description: `Reversing entry for ${event.originalJournalId.value}`,
      reference: `REV-${event.originalJournalId.value}`,
      originalJournalId: event.originalJournalId.value,
      isReversing: true,
      fiscalPeriod,
      status: 'DRAFT', // Will be auto-posted
      lines,
      totalDebit,
      totalCredit,
      currency: 'BDT',
      createdAt: new Date(event.timestamp),
      updatedAt: new Date(event.timestamp),
    });

    await this.readRepository.save(reversingJournal);

    // Invalidate cache for reversing journal
    await this.cacheService.invalidateJournal(event.tenantId, event.reversingJournalId.value);
    this.logger.debug(`Invalidated cache for journal ${event.reversingJournalId.value}`);

    // Update original journal status to REVERSED
    await this.readRepository.update(
      { id: event.originalJournalId.value },
      {
        status: 'REVERSED',
        updatedAt: new Date(event.timestamp),
      }
    );

    // Invalidate cache for original journal
    await this.cacheService.invalidateJournal(event.tenantId, event.originalJournalId.value);
    this.logger.debug(`Invalidated cache for journal ${event.originalJournalId.value}`);

    this.logger.debug(
      `Reversing journal created: ${event.reversingJournalId.value} ` +
      `(lines: ${lines.length}, debit: ${totalDebit}, credit: ${totalCredit})`
    );
    this.logger.debug(`Original journal marked as REVERSED: ${event.originalJournalId.value}`);
  }

  /**
   * Handle JournalValidatedEvent
   * Optional validation state tracking for monitoring
   */
  private async handleValidated(event: JournalValidatedEvent): Promise<void> {
    this.logger.debug(
      `Projecting JournalValidatedEvent: ${event.journalId.value} ` +
      `(valid: ${event.isValid}, messages: ${event.validationMessages.length})`
    );

    // Optional: Update validation state or log for monitoring
    // For now, just log the validation result
    if (!event.isValid) {
      this.logger.warn(
        `Journal ${event.journalId.value} validation failed: ${event.validationMessages.join(', ')}`
      );
    }
  }

  /**
   * Calculate fiscal period from date (Bangladesh July-June fiscal year)
   * Format: FY2024-2025-P01 (P01 = July, P12 = June)
   */
  private calculateFiscalPeriod(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Bangladesh fiscal year: July 1 to June 30
    let fiscalYear: string;
    if (month >= 7) {
      fiscalYear = `FY${year}-${year + 1}`;
    } else {
      fiscalYear = `FY${year - 1}-${year}`;
    }

    // Period format: FY2024-2025-P01 (July = P01, June = P12)
    const period = month >= 7 ? month - 6 : month + 6;
    return `${fiscalYear}-P${String(period).padStart(2, '0')}`;
  }
}
