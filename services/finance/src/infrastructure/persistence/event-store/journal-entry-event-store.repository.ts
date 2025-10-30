import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventSourcedRepository } from './event-sourced.repository';
import { EventStoreService } from './event-store.service';
import {
  JournalEntry,
  JournalType,
} from '../../../domain/aggregates/journal/journal-entry.aggregate';
import { IJournalEntryRepository } from '../../../domain/repositories/journal-entry.repository.interface';
import { TenantContextService } from '../../context/tenant-context.service';
import { JournalEntryReadModel } from '../typeorm/entities/journal-entry.entity';

/**
 * Journal Entry EventStore Repository
 *
 * Implements the IJournalEntryRepository interface using EventStore DB as the persistence layer.
 * Extends EventSourcedRepository to leverage event sourcing capabilities:
 * - save(): Appends domain events to EventStore streams
 * - findById(): Reconstructs JournalEntry aggregate from event stream
 * - exists(): Checks if journal stream exists
 *
 * Additional Operations:
 * - getNextJournalNumber(): Generates sequential journal numbers per day and type
 *
 * Stream Naming Convention:
 * - Format: tenant-{tenantId}-journal-{journalId}
 * - Ensures multi-tenant data isolation
 * - Each tenant's journals stored in separate streams
 *
 * Bangladesh Compliance:
 * - Fiscal year: July 1 to June 30
 * - Fiscal period format: FY2024-2025-P01 (P01 = July, P12 = June)
 * - Journal number format: {TYPE}-YYYY-MM-NNNNNN (e.g., GJ-2024-01-000001)
 * - Support for 9 journal types (GENERAL, SALES, PURCHASE, etc.)
 */
@Injectable()
export class JournalEntryEventStoreRepository
  extends EventSourcedRepository<JournalEntry>
  implements IJournalEntryRepository
{
  // Note: logger is inherited from EventSourcedRepository base class as protected

  constructor(
    eventStore: EventStoreService,
    private readonly tenantContextService: TenantContextService,
    @InjectRepository(JournalEntryReadModel)
    private readonly readRepository: Repository<JournalEntryReadModel>,
  ) {
    super(eventStore, 'journal');
  }

  /**
   * Implements IJournalEntryRepository.save()
   * Extracts tenantId from the aggregate and saves to tenant-scoped stream
   */
  async save(journal: JournalEntry): Promise<void> {
    const tenantId = journal['tenantId']?.value; // Access private tenantId
    if (!tenantId) {
      throw new Error('JournalEntry must have tenantId');
    }
    return this.saveWithTenant(journal, tenantId);
  }

  /**
   * Implements IJournalEntryRepository.findById()
   * Uses provided tenantId or falls back to TenantContextService
   */
  async findById(id: string, tenantId?: string): Promise<JournalEntry | null> {
    const resolvedTenantId = tenantId || this.tenantContextService.getTenantId();
    return this.getByIdWithTenant(id, resolvedTenantId);
  }

  /**
   * Implements IJournalEntryRepository.exists()
   * Checks if journal stream exists in EventStore
   */
  async exists(id: string): Promise<boolean> {
    try {
      const tenantId = this.tenantContextService.getTenantId();
      const streamName = this.getStreamNameWithTenant(id, tenantId);
      const events = await this.eventStore.readStream(streamName);
      return events.length > 0;
    } catch (error: any) {
      if (error.type === 'stream-not-found') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Implements IJournalEntryRepository.getNextJournalNumber()
   * Generates journal number in format: {TYPE}-YYYY-MM-NNNNNN
   * Sequential numbering per day and type for the tenant
   *
   * Type Prefixes:
   * - GJ: General Journal
   * - SJ: Sales Journal
   * - PJ: Purchase Journal
   * - CR: Cash Receipt
   * - CP: Cash Payment
   * - AJ: Adjustment Journal
   * - RJ: Reversing Journal
   * - CJ: Closing Journal
   * - OJ: Opening Journal
   *
   * Example: GJ-2024-10-000001
   */
  async getNextJournalNumber(date: Date, type: JournalType, tenantId: string): Promise<string> {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');

      // Journal type prefix mapping
      const typePrefix: Record<JournalType, string> = {
        [JournalType.GENERAL]: 'GJ',
        [JournalType.SALES]: 'SJ',
        [JournalType.PURCHASE]: 'PJ',
        [JournalType.CASH_RECEIPT]: 'CR',
        [JournalType.CASH_PAYMENT]: 'CP',
        [JournalType.ADJUSTMENT]: 'AJ',
        [JournalType.REVERSING]: 'RJ',
        [JournalType.CLOSING]: 'CJ',
        [JournalType.OPENING]: 'OJ',
      };

      const prefix = typePrefix[type];
      const datePrefix = `${year}-${month}`;

      // Query read model for last journal number of the month for this tenant and type
      const lastJournal = await this.readRepository
        .createQueryBuilder('journal')
        .where('journal.tenantId = :tenantId', { tenantId })
        .andWhere('journal.journalNumber LIKE :prefix', { prefix: `${prefix}-${datePrefix}-%` })
        .orderBy('journal.journalNumber', 'DESC')
        .getOne();

      let sequence = 1;

      if (lastJournal && lastJournal.journalNumber) {
        // Extract sequence number from last journal number
        // Format: {TYPE}-YYYY-MM-NNNNNN
        const parts = lastJournal.journalNumber.split('-');
        if (parts.length === 4) {
          const lastSequence = parseInt(parts[3], 10);
          if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
          }
        }
      }

      const sequenceStr = String(sequence).padStart(6, '0');
      const journalNumber = `${prefix}-${datePrefix}-${sequenceStr}`;

      this.logger.debug(
        `Generated journal number ${journalNumber} for tenant ${tenantId} ` +
        `(type: ${type}, date: ${date.toISOString().slice(0, 10)})`
      );

      return journalNumber;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to generate journal number: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Creates an empty JournalEntry aggregate for event replay.
   * Required by EventSourcedRepository base class.
   */
  protected createEmptyAggregate(): JournalEntry {
    return new JournalEntry();
  }

  /**
   * Override getStreamName to include tenant isolation
   * Format: tenant-{tenantId}-journal-{journalId}
   *
   * Note: This ensures multi-tenant data isolation in EventStore.
   * Each tenant's journals are stored in separate streams.
   */
  protected getStreamName(aggregateId: string): string {
    // Base class signature doesn't accept tenantId, so we use a separate method
    return `journal-${aggregateId}`;
  }

  /**
   * Get stream name with tenant isolation
   * This method is used internally for tenant-scoped operations
   */
  private getStreamNameWithTenant(aggregateId: string, tenantId: string): string {
    return `tenant-${tenantId}-journal-${aggregateId}`;
  }

  /**
   * Enhanced save method with tenant context
   * Overrides base class to support tenant-scoped streams
   */
  async saveWithTenant(aggregate: JournalEntry, tenantId: string): Promise<void> {
    const events = aggregate.getUncommittedEvents();

    if (events.length === 0) {
      this.logger.debug(`No events to save for journal ${aggregate.getId().value}`);
      return;
    }

    const streamName = this.getStreamNameWithTenant(aggregate.getId().value, tenantId);

    try {
      const expectedRevision =
        aggregate.version > 0 ? BigInt(aggregate.version - 1) : undefined;

      await this.eventStore.appendEvents(streamName, events, expectedRevision);

      aggregate.markEventsAsCommitted();

      this.logger.debug(
        `Saved ${events.length} events for journal ${aggregate.getId().value} in tenant ${tenantId}. ` +
        `New version: ${aggregate.version}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to save journal ${aggregate.getId().value}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Enhanced getById method with tenant context
   * Overrides base class to support tenant-scoped streams
   */
  async getByIdWithTenant(id: string, tenantId: string): Promise<JournalEntry | null> {
    const streamName = this.getStreamNameWithTenant(id, tenantId);

    try {
      const events = await this.eventStore.readStream(streamName);

      if (events.length === 0) {
        this.logger.debug(`No events found for journal ${id} in tenant ${tenantId}`);
        return null;
      }

      const aggregate = this.createEmptyAggregate();
      aggregate.loadFromHistory(events);

      this.logger.debug(
        `Loaded journal ${id} from tenant ${tenantId} with ${events.length} events. ` +
        `Version: ${aggregate.version}`,
      );

      return aggregate;
    } catch (error: any) {
      if (error.type === 'stream-not-found') {
        this.logger.debug(`Stream not found for journal ${id} in tenant ${tenantId}`);
        return null;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to load journal ${id}: ${errorMessage}`);
      throw error;
    }
  }
}
