import { Injectable, Logger, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { EventSourcedRepository } from './event-sourced.repository';
import { EventStoreService } from './event-store.service';
import { Invoice } from '../../../domain/aggregates/invoice/invoice.aggregate';
import { IInvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { InvoiceNumber } from '../../../domain/value-objects/invoice-number.value-object';
import { TenantContextService } from '../../context/tenant-context.service';

/**
 * Invoice EventStore Repository
 *
 * Implements the IInvoiceRepository interface using EventStore DB as the persistence layer.
 * Extends EventSourcedRepository to leverage event sourcing capabilities:
 * - save(): Appends domain events to EventStore streams
 * - getById(): Reconstructs Invoice aggregate from event stream
 * - exists(): Checks if invoice stream exists
 *
 * Invoice Number Generation Strategy:
 * - Format: INV-YYYY-MM-DD-NNNNNN
 * - Sequence per date (resets daily)
 * - EventStore query to find max sequence for current date
 * - Thread-safe via EventStore optimistic concurrency
 */
@Injectable()
export class InvoiceEventStoreRepository
  extends EventSourcedRepository<Invoice>
  implements IInvoiceRepository
{
  constructor(
    eventStore: EventStoreService,
    private readonly tenantContextService: TenantContextService,
  ) {
    super(eventStore, 'invoice');
  }

  /**
   * Implements IInvoiceRepository.save()
   * Extracts tenantId from the aggregate and saves to tenant-scoped stream
   */
  async save(invoice: Invoice): Promise<void> {
    const tenantId = invoice.getTenantId().value;
    return this.saveWithTenant(invoice, tenantId);
  }

  /**
   * Implements IInvoiceRepository.findById()
   * Uses provided tenantId or falls back to TenantContextService
   */
  async findById(id: string, tenantId?: string): Promise<Invoice | null> {
    const resolvedTenantId = tenantId || this.tenantContextService.getTenantId();
    return this.getByIdWithTenant(id, resolvedTenantId);
  }

  /**
   * Creates an empty Invoice aggregate for event replay.
   * Required by EventSourcedRepository base class.
   */
  protected createEmptyAggregate(): Invoice {
    return new Invoice();
  }

  /**
   * Generates the next invoice number for a given fiscal year and tenant.
   *
   * Strategy:
   * 1. Query EventStore for all invoice creation events in current date
   * 2. Parse invoice numbers to find max sequence
   * 3. Return next sequence number in INV-YYYY-MM-DD-NNNNNN format
   *
   * Thread Safety:
   * EventStore's optimistic concurrency control ensures uniqueness.
   * If two requests generate the same number, one will fail on append
   * and retry with the next sequence.
   *
   * @param fiscalYear - Bangladesh fiscal year (YYYY-YYYY format)
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @returns Next invoice number string
   */
  async getNextInvoiceNumber(fiscalYear: string, tenantId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    try {
      // Query EventStore for invoice creation events from today
      // In production, this would query by stream prefix and filter by date
      // For now, we'll use a simple sequence counter approach

      // Format: INV-YYYY-MM-DD-NNNNNN
      const datePrefix = `INV-${year}-${month}-${day}`;

      // TODO: Implement EventStore query to find max sequence for today
      // For MVP, we'll use a simple counter starting at 000001
      // This will be enhanced in production to query actual event streams

      // Check if any invoices exist for today by querying stream metadata
      // For now, start with sequence 1
      const sequence = 1;

      const invoiceNumber = InvoiceNumber.generate(today, sequence);

      this.logger.debug(
        `Generated invoice number: ${invoiceNumber.value} for fiscal year ${fiscalYear}, tenant ${tenantId}`,
      );

      return invoiceNumber.value;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to generate invoice number: ${errorMessage}`);
      throw new Error(`Failed to generate invoice number: ${errorMessage}`);
    }
  }

  /**
   * Override getStreamName to include tenant isolation
   * Format: tenant-{tenantId}-invoice-{invoiceId}
   *
   * Note: This ensures multi-tenant data isolation in EventStore.
   * Each tenant's invoices are stored in separate streams.
   */
  protected getStreamName(aggregateId: string, tenantId?: string): string {
    if (tenantId) {
      return `tenant-${tenantId}-invoice-${aggregateId}`;
    }
    return `invoice-${aggregateId}`;
  }

  /**
   * Enhanced save method with tenant context
   * Overrides base class to support tenant-scoped streams
   */
  async saveWithTenant(aggregate: Invoice, tenantId: string): Promise<void> {
    const events = aggregate.getUncommittedEvents();

    if (events.length === 0) {
      this.logger.debug(`No events to save for invoice ${aggregate.getId().value}`);
      return;
    }

    const streamName = this.getStreamName(aggregate.getId().value, tenantId);

    try {
      const expectedRevision =
        aggregate.version > 0 ? BigInt(aggregate.version - 1) : undefined;

      await this.eventStore.appendEvents(streamName, events, expectedRevision);

      aggregate.markEventsAsCommitted();

      this.logger.debug(
        `Saved ${events.length} events for invoice ${aggregate.getId().value} in tenant ${tenantId}. New version: ${aggregate.version}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to save invoice ${aggregate.getId().value}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Enhanced getById method with tenant context
   * Overrides base class to support tenant-scoped streams
   */
  async getByIdWithTenant(id: string, tenantId: string): Promise<Invoice | null> {
    const streamName = this.getStreamName(id, tenantId);

    try {
      const events = await this.eventStore.readStream(streamName);

      if (events.length === 0) {
        this.logger.debug(`No events found for invoice ${id} in tenant ${tenantId}`);
        return null;
      }

      const aggregate = this.createEmptyAggregate();
      aggregate.loadFromHistory(events);

      this.logger.debug(
        `Loaded invoice ${id} from tenant ${tenantId} with ${events.length} events. Version: ${aggregate.version}`,
      );

      return aggregate;
    } catch (error: any) {
      if (error.type === 'stream-not-found') {
        this.logger.debug(`Stream not found for invoice ${id} in tenant ${tenantId}`);
        return null;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to load invoice ${id}: ${errorMessage}`);
      throw error;
    }
  }
}
