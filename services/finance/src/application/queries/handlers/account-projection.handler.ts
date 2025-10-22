import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import {
  AccountCreatedEvent,
  AccountBalanceUpdatedEvent,
  AccountDeactivatedEvent,
} from '../../../domain/aggregates/chart-of-account/chart-of-account.aggregate';
import { ChartOfAccountReadModel } from '../../../infrastructure/persistence/typeorm/entities/chart-of-account.entity';
import { FinanceCacheService } from '../../../infrastructure/cache/cache.service';

/**
 * Account Projection Handler
 *
 * Event handler that maintains the read model (PostgreSQL) by projecting
 * domain events from the write model (EventStore).
 *
 * Event Sourcing Pattern:
 * 1. Domain aggregate emits events → EventStore (write model)
 * 2. Events published to Kafka → This handler listens
 * 3. Handler projects events → PostgreSQL read model
 * 4. Query handlers read from optimized read model
 *
 * Events Handled:
 * - AccountCreatedEvent: Creates new account record in read model
 * - AccountBalanceUpdatedEvent: Updates account balance
 * - AccountDeactivatedEvent: Marks account as inactive
 *
 * Eventual Consistency:
 * - Read model is eventually consistent with write model
 * - Small delay (milliseconds) between write and read availability
 * - Acceptable for financial reporting (non-critical path)
 */
@EventsHandler(AccountCreatedEvent, AccountBalanceUpdatedEvent, AccountDeactivatedEvent)
export class AccountProjectionHandler implements IEventHandler {
  private readonly logger = new Logger(AccountProjectionHandler.name);

  constructor(
    @InjectRepository(ChartOfAccountReadModel)
    private readonly accountRepository: Repository<ChartOfAccountReadModel>,
    private readonly cacheService: FinanceCacheService,
  ) {}

  async handle(event: AccountCreatedEvent | AccountBalanceUpdatedEvent | AccountDeactivatedEvent): Promise<void> {
    try {
      switch (event.constructor.name) {
        case 'AccountCreatedEvent':
          await this.handleAccountCreated(event as AccountCreatedEvent);
          break;
        case 'AccountBalanceUpdatedEvent':
          await this.handleBalanceUpdated(event as AccountBalanceUpdatedEvent);
          break;
        case 'AccountDeactivatedEvent':
          await this.handleDeactivated(event as AccountDeactivatedEvent);
          break;
        default:
          this.logger.warn(`Unknown event type: ${event.constructor.name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error handling ${event.constructor.name}: ${errorMessage}`, errorStack);
      // Don't throw - projection errors shouldn't stop the event flow
      // Failed events can be replayed later
    }
  }

  /**
   * Handles AccountCreatedEvent
   *
   * Creates a new account record in the read model with:
   * - Account details (code, name, type)
   * - Initial balance (zero)
   * - Active status (true)
   * - Multi-tenant isolation
   */
  private async handleAccountCreated(event: AccountCreatedEvent): Promise<void> {
    this.logger.log(`Projecting AccountCreatedEvent: ${event.accountId.value} (${event.accountCode})`);

    // Check if account already exists (idempotency)
    let projection = await this.accountRepository.findOne({
      where: { id: event.accountId.value },
    });

    if (projection) {
      this.logger.warn(`Account ${event.accountId.value} already exists in read model - skipping`);
      return;
    }

    // Create new read model entity
    projection = this.accountRepository.create({
      id: event.accountId.value,
      tenantId: event.tenantId,
      accountCode: event.accountCode,
      accountName: event.accountName,
      accountType: event.accountType,
      parentAccountId: event.parentAccountId?.value || null,
      balance: 0, // Initial balance is always zero
      currency: event.currency,
      isActive: true,
      deactivationReason: null,
      deactivatedAt: null,
      deactivatedBy: null,
    });

    await this.accountRepository.save(projection);

    // Invalidate cache after successful update
    await this.cacheService.invalidateAccount(event.tenantId, event.accountId.value);
    this.logger.debug(`Invalidated cache for account ${event.accountId.value}`);

    this.logger.log(`Account ${event.accountId.value} created in read model`);
  }

  /**
   * Handles AccountBalanceUpdatedEvent
   *
   * Updates the account balance in the read model.
   * Balance updates occur when:
   * - Transactions are posted to the account
   * - Journal entries are created
   * - Adjustments are made
   */
  private async handleBalanceUpdated(event: AccountBalanceUpdatedEvent): Promise<void> {
    this.logger.log(`Projecting AccountBalanceUpdatedEvent: ${event.accountId.value}`);

    const projection = await this.accountRepository.findOne({
      where: { id: event.accountId.value },
    });

    if (!projection) {
      this.logger.warn(`Account ${event.accountId.value} not found in read model - cannot update balance`);
      return;
    }

    // Update balance with new value
    projection.balance = event.newBalance.getAmount();
    projection.updatedAt = new Date(); // Trigger updated timestamp

    await this.accountRepository.save(projection);

    // Invalidate cache after successful update
    await this.cacheService.invalidateAccount(event.tenantId, event.accountId.value);
    this.logger.debug(`Invalidated cache for account ${event.accountId.value}`);

    this.logger.log(
      `Account ${event.accountId.value} balance updated: ` +
      `${event.previousBalance.getAmount()} → ${event.newBalance.getAmount()}`
    );
  }

  /**
   * Handles AccountDeactivatedEvent
   *
   * Marks the account as inactive in the read model.
   * Deactivated accounts:
   * - Cannot be used in new transactions
   * - Retain all historical data
   * - Can be queried for reporting
   * - Store deactivation reason for audit trail
   */
  private async handleDeactivated(event: AccountDeactivatedEvent): Promise<void> {
    this.logger.log(`Projecting AccountDeactivatedEvent: ${event.accountId.value}`);

    const projection = await this.accountRepository.findOne({
      where: { id: event.accountId.value },
    });

    if (!projection) {
      this.logger.warn(`Account ${event.accountId.value} not found in read model - cannot deactivate`);
      return;
    }

    // Mark as inactive and store audit information
    projection.isActive = false;
    projection.deactivationReason = event.reason;
    projection.deactivatedAt = event.deactivatedAt;
    projection.updatedAt = new Date(); // Trigger updated timestamp

    await this.accountRepository.save(projection);

    // Invalidate cache after successful update
    await this.cacheService.invalidateAccount(event.tenantId, event.accountId.value);
    this.logger.debug(`Invalidated cache for account ${event.accountId.value}`);

    this.logger.log(`Account ${event.accountId.value} deactivated in read model`);
  }
}
