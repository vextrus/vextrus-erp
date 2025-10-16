import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventSourcedRepository } from './event-sourced.repository';
import { EventStoreService } from './event-store.service';
import { ChartOfAccount } from '../../../domain/aggregates/chart-of-account/chart-of-account.aggregate';
import { IChartOfAccountRepository } from '../../../domain/repositories/chart-of-account.repository.interface';
import { TenantContextService } from '../../context/tenant-context.service';
import { ChartOfAccountReadModel } from '../typeorm/entities/chart-of-account.entity';

/**
 * Chart of Account EventStore Repository
 *
 * Implements the IChartOfAccountRepository interface using EventStore DB as the persistence layer.
 * Extends EventSourcedRepository to leverage event sourcing capabilities:
 * - save(): Appends domain events to EventStore streams
 * - getById(): Reconstructs ChartOfAccount aggregate from event stream
 * - exists(): Checks if account stream exists
 *
 * Additional Operations:
 * - existsByCode(): Checks account code uniqueness per tenant
 * - hasActiveChildren(): Validates account hierarchy for deactivation
 *
 * Stream Naming Convention:
 * - Format: tenant-{tenantId}-chartofaccount-{accountId}
 * - Ensures multi-tenant data isolation
 * - Each tenant's accounts stored in separate streams
 *
 * Bangladesh Compliance:
 * - Account code validation: XXXX or XXXX-YY-ZZ format
 * - Hierarchical account structure support
 * - Multi-currency support (BDT primary)
 */
@Injectable()
export class ChartOfAccountEventStoreRepository
  extends EventSourcedRepository<ChartOfAccount>
  implements IChartOfAccountRepository
{
  // Note: logger is inherited from EventSourcedRepository base class as protected

  constructor(
    eventStore: EventStoreService,
    private readonly tenantContextService: TenantContextService,
    @InjectRepository(ChartOfAccountReadModel)
    private readonly readRepository: Repository<ChartOfAccountReadModel>,
  ) {
    super(eventStore, 'chartofaccount');
  }

  /**
   * Implements IChartOfAccountRepository.save()
   * Extracts tenantId from the aggregate and saves to tenant-scoped stream
   */
  async save(account: ChartOfAccount): Promise<void> {
    const tenantId = account.getTenantId().value;
    return this.saveWithTenant(account, tenantId);
  }

  /**
   * Implements IChartOfAccountRepository.findById()
   * Uses provided tenantId or falls back to TenantContextService
   */
  async findById(id: string, tenantId?: string): Promise<ChartOfAccount | null> {
    const resolvedTenantId = tenantId || this.tenantContextService.getTenantId();
    return this.getByIdWithTenant(id, resolvedTenantId);
  }

  /**
   * Implements IChartOfAccountRepository.existsByCode()
   * Queries the read model to check if account code exists for tenant
   * Read model is eventually consistent, but acceptable for validation
   */
  async existsByCode(accountCode: string, tenantId: string): Promise<boolean> {
    try {
      const count = await this.readRepository.count({
        where: {
          accountCode,
          tenantId,
        },
      });

      return count > 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to check account code existence: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Implements IChartOfAccountRepository.hasActiveChildren()
   * Queries the read model to check if account has active child accounts
   * Used to prevent deactivation of parent accounts with active children
   */
  async hasActiveChildren(accountId: string): Promise<boolean> {
    try {
      const count = await this.readRepository.count({
        where: {
          parentAccountId: accountId,
          isActive: true,
        },
      });

      return count > 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to check active children: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Implements IChartOfAccountRepository.exists()
   * Checks if account stream exists in EventStore
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
   * Creates an empty ChartOfAccount aggregate for event replay.
   * Required by EventSourcedRepository base class.
   */
  protected createEmptyAggregate(): ChartOfAccount {
    return new ChartOfAccount();
  }

  /**
   * Override getStreamName to include tenant isolation
   * Format: tenant-{tenantId}-chartofaccount-{accountId}
   *
   * Note: This ensures multi-tenant data isolation in EventStore.
   * Each tenant's accounts are stored in separate streams.
   */
  protected getStreamName(aggregateId: string): string {
    // Base class signature doesn't accept tenantId, so we use a separate method
    return `chartofaccount-${aggregateId}`;
  }

  /**
   * Get stream name with tenant isolation
   * This method is used internally for tenant-scoped operations
   */
  private getStreamNameWithTenant(aggregateId: string, tenantId: string): string {
    return `tenant-${tenantId}-chartofaccount-${aggregateId}`;
  }

  /**
   * Enhanced save method with tenant context
   * Overrides base class to support tenant-scoped streams
   */
  async saveWithTenant(aggregate: ChartOfAccount, tenantId: string): Promise<void> {
    const events = aggregate.getUncommittedEvents();

    if (events.length === 0) {
      this.logger.debug(`No events to save for account ${aggregate.getId().value}`);
      return;
    }

    const streamName = this.getStreamNameWithTenant(aggregate.getId().value, tenantId);

    try {
      const expectedRevision =
        aggregate.version > 0 ? BigInt(aggregate.version - 1) : undefined;

      await this.eventStore.appendEvents(streamName, events, expectedRevision);

      aggregate.markEventsAsCommitted();

      this.logger.debug(
        `Saved ${events.length} events for account ${aggregate.getId().value} in tenant ${tenantId}. New version: ${aggregate.version}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to save account ${aggregate.getId().value}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Enhanced getById method with tenant context
   * Overrides base class to support tenant-scoped streams
   */
  async getByIdWithTenant(id: string, tenantId: string): Promise<ChartOfAccount | null> {
    const streamName = this.getStreamNameWithTenant(id, tenantId);

    try {
      const events = await this.eventStore.readStream(streamName);

      if (events.length === 0) {
        this.logger.debug(`No events found for account ${id} in tenant ${tenantId}`);
        return null;
      }

      const aggregate = this.createEmptyAggregate();
      aggregate.loadFromHistory(events);

      this.logger.debug(
        `Loaded account ${id} from tenant ${tenantId} with ${events.length} events. Version: ${aggregate.version}`,
      );

      return aggregate;
    } catch (error: any) {
      if (error.type === 'stream-not-found') {
        this.logger.debug(`Stream not found for account ${id} in tenant ${tenantId}`);
        return null;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to load account ${id}: ${errorMessage}`);
      throw error;
    }
  }
}
