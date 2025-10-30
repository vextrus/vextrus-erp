import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, NotFoundException } from '@nestjs/common';
import { UpdateAccountCommand } from '../update-account.command';
import { IChartOfAccountRepository } from '../../../domain/repositories/chart-of-account.repository.interface';
import { AccountId } from '../../../domain/aggregates/chart-of-account/chart-of-account.aggregate';

/**
 * Update Account Handler
 *
 * Handles the UpdateAccountCommand using CQRS pattern with event sourcing.
 * Only ACTIVE accounts can be updated. INACTIVE accounts are immutable.
 *
 * Business Rules:
 * - Only ACTIVE accounts can be updated
 * - accountCode, accountType, and currency are IMMUTABLE
 * - Only accountName and parentAccountId can be updated
 * - All fields are optional (partial updates supported)
 * - Updated account events are emitted for event sourcing
 *
 * Bangladesh Compliance:
 * - Maintains account hierarchy integrity
 * - Preserves account code structure for reporting
 */
@CommandHandler(UpdateAccountCommand)
export class UpdateAccountHandler implements ICommandHandler<UpdateAccountCommand> {
  private readonly logger = new Logger(UpdateAccountHandler.name);

  constructor(
    private readonly accountRepository: IChartOfAccountRepository,
  ) {}

  async execute(command: UpdateAccountCommand): Promise<string> {
    this.logger.log(`Updating account ${command.accountId}`);

    // Load account aggregate from event store
    const account = await this.accountRepository.findById(command.accountId, command.tenantId);
    if (!account) {
      throw new NotFoundException(`Account ${command.accountId} not found`);
    }

    // Apply updates (each method validates ACTIVE status)
    if (command.accountName !== undefined) {
      account.updateAccountName(command.accountName, command.userId);
    }

    if (command.parentAccountId !== undefined) {
      const newParentId = command.parentAccountId
        ? new AccountId(command.parentAccountId)
        : undefined;
      account.updateParentAccount(newParentId, command.userId);
    }

    // Save account (persists events to EventStore)
    await this.accountRepository.save(account);

    // Publish domain events via repository
    // Events will be projected to read models by ProjectionHandlers

    this.logger.log(`Account ${command.accountId} updated successfully`);
    return command.accountId;
  }
}
