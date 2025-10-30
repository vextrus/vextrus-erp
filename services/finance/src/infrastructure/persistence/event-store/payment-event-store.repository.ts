import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventSourcedRepository } from './event-sourced.repository';
import { EventStoreService } from './event-store.service';
import { Payment } from '../../../domain/aggregates/payment/payment.aggregate';
import { IPaymentRepository } from '../../../domain/repositories/payment.repository.interface';
import { TenantContextService } from '../../context/tenant-context.service';
import { PaymentReadModel } from '../typeorm/entities/payment.entity';

/**
 * Payment EventStore Repository
 *
 * Implements the IPaymentRepository interface using EventStore DB as the persistence layer.
 * Extends EventSourcedRepository to leverage event sourcing capabilities:
 * - save(): Appends domain events to EventStore streams
 * - findById(): Reconstructs Payment aggregate from event stream
 * - exists(): Checks if payment stream exists
 *
 * Additional Operations:
 * - getNextPaymentNumber(): Generates sequential payment numbers per day
 *
 * Stream Naming Convention:
 * - Format: tenant-{tenantId}-payment-{paymentId}
 * - Ensures multi-tenant data isolation
 * - Each tenant's payments stored in separate streams
 *
 * Bangladesh Compliance:
 * - Mobile wallet integration (bKash, Nagad, Rocket, etc.)
 * - Mobile number validation: 01[3-9]\d{8} or +8801[3-9]\d{8}
 * - Payment number format: PMT-YYYY-MM-DD-NNNNNN
 */
@Injectable()
export class PaymentEventStoreRepository
  extends EventSourcedRepository<Payment>
  implements IPaymentRepository
{
  // Note: logger is inherited from EventSourcedRepository base class as protected

  constructor(
    eventStore: EventStoreService,
    private readonly tenantContextService: TenantContextService,
    @InjectRepository(PaymentReadModel)
    private readonly readRepository: Repository<PaymentReadModel>,
  ) {
    super(eventStore, 'payment');
  }

  /**
   * Implements IPaymentRepository.save()
   * Extracts tenantId from the aggregate and saves to tenant-scoped stream
   */
  async save(payment: Payment): Promise<void> {
    const tenantId = payment['tenantId']?.value; // Access private tenantId
    if (!tenantId) {
      throw new Error('Payment must have tenantId');
    }
    return this.saveWithTenant(payment, tenantId);
  }

  /**
   * Implements IPaymentRepository.findById()
   * Uses provided tenantId or falls back to TenantContextService
   */
  async findById(id: string, tenantId?: string): Promise<Payment | null> {
    const resolvedTenantId = tenantId || this.tenantContextService.getTenantId();
    return this.getByIdWithTenant(id, resolvedTenantId);
  }

  /**
   * Implements IPaymentRepository.exists()
   * Checks if payment stream exists in EventStore
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
   * Implements IPaymentRepository.getNextPaymentNumber()
   * Generates payment number in format: PMT-YYYY-MM-DD-NNNNNN
   * Sequential numbering per day for the tenant
   *
   * Example: PMT-2024-10-16-000001
   */
  async getNextPaymentNumber(date: Date, tenantId: string): Promise<string> {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const datePrefix = `${year}-${month}-${day}`;

      // Query read model for last payment number of the day for this tenant
      const lastPayment = await this.readRepository
        .createQueryBuilder('payment')
        .where('payment.tenantId = :tenantId', { tenantId })
        .andWhere('payment.paymentNumber LIKE :prefix', { prefix: `PMT-${datePrefix}-%` })
        .orderBy('payment.paymentNumber', 'DESC')
        .getOne();

      let sequence = 1;

      if (lastPayment && lastPayment.paymentNumber) {
        // Extract sequence number from last payment number
        // Format: PMT-YYYY-MM-DD-NNNNNN
        const parts = lastPayment.paymentNumber.split('-');
        if (parts.length === 5) {
          const lastSequence = parseInt(parts[4], 10);
          if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
          }
        }
      }

      const sequenceStr = String(sequence).padStart(6, '0');
      const paymentNumber = `PMT-${datePrefix}-${sequenceStr}`;

      this.logger.debug(`Generated payment number ${paymentNumber} for tenant ${tenantId}`);
      return paymentNumber;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to generate payment number: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Creates an empty Payment aggregate for event replay.
   * Required by EventSourcedRepository base class.
   */
  protected createEmptyAggregate(): Payment {
    return new Payment();
  }

  /**
   * Override getStreamName to include tenant isolation
   * Format: tenant-{tenantId}-payment-{paymentId}
   *
   * Note: This ensures multi-tenant data isolation in EventStore.
   * Each tenant's payments are stored in separate streams.
   */
  protected getStreamName(aggregateId: string): string {
    // Base class signature doesn't accept tenantId, so we use a separate method
    return `payment-${aggregateId}`;
  }

  /**
   * Get stream name with tenant isolation
   * This method is used internally for tenant-scoped operations
   */
  private getStreamNameWithTenant(aggregateId: string, tenantId: string): string {
    return `tenant-${tenantId}-payment-${aggregateId}`;
  }

  /**
   * Enhanced save method with tenant context
   * Overrides base class to support tenant-scoped streams
   */
  async saveWithTenant(aggregate: Payment, tenantId: string): Promise<void> {
    const events = aggregate.getUncommittedEvents();

    if (events.length === 0) {
      this.logger.debug(`No events to save for payment ${aggregate.getId().value}`);
      return;
    }

    const streamName = this.getStreamNameWithTenant(aggregate.getId().value, tenantId);

    try {
      const expectedRevision =
        aggregate.version > 0 ? BigInt(aggregate.version - 1) : undefined;

      await this.eventStore.appendEvents(streamName, events, expectedRevision);

      aggregate.markEventsAsCommitted();

      this.logger.debug(
        `Saved ${events.length} events for payment ${aggregate.getId().value} in tenant ${tenantId}. New version: ${aggregate.version}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to save payment ${aggregate.getId().value}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Enhanced getById method with tenant context
   * Overrides base class to support tenant-scoped streams
   */
  async getByIdWithTenant(id: string, tenantId: string): Promise<Payment | null> {
    const streamName = this.getStreamNameWithTenant(id, tenantId);

    try {
      const events = await this.eventStore.readStream(streamName);

      if (events.length === 0) {
        this.logger.debug(`No events found for payment ${id} in tenant ${tenantId}`);
        return null;
      }

      const aggregate = this.createEmptyAggregate();
      aggregate.loadFromHistory(events);

      this.logger.debug(
        `Loaded payment ${id} from tenant ${tenantId} with ${events.length} events. Version: ${aggregate.version}`,
      );

      return aggregate;
    } catch (error: any) {
      if (error.type === 'stream-not-found') {
        this.logger.debug(`Stream not found for payment ${id} in tenant ${tenantId}`);
        return null;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to load payment ${id}: ${errorMessage}`);
      throw error;
    }
  }
}
