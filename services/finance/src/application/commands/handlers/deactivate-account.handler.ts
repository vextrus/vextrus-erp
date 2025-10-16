import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { DeactivateAccountCommand } from '../deactivate-account.command';
import { IChartOfAccountRepository } from '../../../domain/repositories/chart-of-account.repository.interface';

/**
 * Deactivate Account Command Handler
 *
 * Handles the deactivation of chart of accounts.
 * Loads the aggregate from EventStore, validates business rules,
 * and persists the deactivation event with reason for audit trail.
 *
 * Business Rules (enforced by aggregate):
 * - Account must have zero balance
 * - Account must not have active child accounts
 * - Reason must be provided for audit trail
 * - Account must not already be deactivated
 */
@CommandHandler(DeactivateAccountCommand)
export class DeactivateAccountHandler implements ICommandHandler<DeactivateAccountCommand> {
  private readonly logger = new Logger(DeactivateAccountHandler.name);

  constructor(
    @Inject('IChartOfAccountRepository')
    private readonly repository: IChartOfAccountRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeactivateAccountCommand): Promise<void> {
    this.logger.log(`Deactivating account: ${command.accountId}, reason: ${command.reason}`);

    try {
      // Load account aggregate from event store
      const account = await this.repository.findById(command.accountId);

      if (!account) {
        throw new NotFoundException(`Account not found: ${command.accountId}`);
      }

      // Check for active child accounts
      const hasActiveChildren = await this.repository.hasActiveChildren(command.accountId);
      if (hasActiveChildren) {
        throw new Error(
          `Cannot deactivate account ${command.accountId}: it has active child accounts. ` +
          `Please deactivate all child accounts first.`
        );
      }

      // Apply business logic (will throw if balance is non-zero or already deactivated)
      account.deactivate(command.reason);

      // Persist events to event store
      await this.repository.save(account);

      // Publish domain events to Kafka
      const events = account.getUncommittedEvents();
      this.logger.log(`Publishing ${events.length} domain events for account deactivation ${command.accountId}`);

      for (const event of events) {
        this.eventBus.publish(event);
      }

      this.logger.log(`Account deactivated successfully: ${command.accountId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to deactivate account: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
