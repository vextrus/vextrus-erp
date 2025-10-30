import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CreateAccountCommand } from '../create-account.command';
import { IChartOfAccountRepository } from '../../../domain/repositories/chart-of-account.repository.interface';
import { ChartOfAccount, TenantId, AccountType, Currency } from '../../../domain/aggregates/chart-of-account/chart-of-account.aggregate';

/**
 * Create Account Command Handler
 *
 * Handles the creation of new chart of accounts using CQRS pattern.
 * Creates a ChartOfAccount aggregate, persists it to EventStore,
 * and publishes domain events to Kafka via EventBus.
 *
 * Business Rules:
 * - Account code must follow Bangladesh format: XXXX or XXXX-YY-ZZ
 * - Account code must be unique per tenant
 * - Parent account must exist if specified
 * - Parent account type must match child account type
 */
@CommandHandler(CreateAccountCommand)
export class CreateAccountHandler implements ICommandHandler<CreateAccountCommand> {
  private readonly logger = new Logger(CreateAccountHandler.name);

  constructor(
    @Inject('IChartOfAccountRepository')
    private readonly repository: IChartOfAccountRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateAccountCommand): Promise<string> {
    this.logger.log(`Creating account: ${command.accountCode} - ${command.accountName}`);

    try {
      // Validate account code uniqueness
      const exists = await this.repository.existsByCode(command.accountCode, command.tenantId);
      if (exists) {
        throw new Error(`Account code ${command.accountCode} already exists for this tenant`);
      }

      // Validate parent account if specified
      if (command.parentAccountId) {
        const parentAccount = await this.repository.findById(command.parentAccountId, command.tenantId);
        if (!parentAccount) {
          throw new Error(`Parent account ${command.parentAccountId} not found`);
        }

        // Validate parent account type matches
        if (parentAccount.getAccountType() !== command.accountType) {
          throw new Error(
            `Parent account type (${parentAccount.getAccountType()}) must match child account type (${command.accountType})`
          );
        }
      }

      // Create the account aggregate using domain logic
      const account = ChartOfAccount.create({
        accountCode: command.accountCode,
        accountName: command.accountName,
        accountType: command.accountType as AccountType,
        currency: command.currency as Currency,
        tenantId: new TenantId(command.tenantId),
        parentAccountId: command.parentAccountId ? { value: command.parentAccountId } : undefined,
      });

      // Persist to EventStore (write model)
      await this.repository.save(account);

      // Publish domain events to Kafka for read model projection
      const events = account.getUncommittedEvents();
      this.logger.log(`Publishing ${events.length} domain events for account ${account.getId().value}`);

      for (const event of events) {
        this.eventBus.publish(event);
      }

      const accountId = account.getId().value;
      this.logger.log(`Account created successfully: ${accountId} (${command.accountCode})`);

      return accountId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create account: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
