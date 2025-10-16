import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards, Logger, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ChartOfAccountDto } from '../dto/chart-of-account.dto';
import { CreateAccountInput } from '../inputs/create-account.input';
import { AccountType } from '../dto/enums.dto';
import { JwtAuthGuard } from '../../../infrastructure/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserContext } from '../../../infrastructure/decorators/current-user.decorator';
import { CreateAccountCommand } from '../../../application/commands/create-account.command';
import { DeactivateAccountCommand } from '../../../application/commands/deactivate-account.command';
import { GetAccountQuery } from '../../../application/queries/get-account.query';
import { GetAccountsQuery } from '../../../application/queries/get-accounts.query';
import { GetAccountByCodeQuery } from '../../../application/queries/get-account-by-code.query';

/**
 * Chart of Account GraphQL Resolver
 *
 * Provides GraphQL API for chart of accounts management using CQRS pattern.
 * All mutations execute commands via CommandBus.
 * All queries execute queries via QueryBus.
 *
 * Bangladesh Compliance:
 * - Account codes follow Bangladesh standard: XXXX or XXXX-YY-ZZ
 * - Hierarchical account structure support
 * - Multi-currency support (BDT primary)
 * - Account types aligned with Bangladesh accounting standards
 */
@Resolver(() => ChartOfAccountDto)
export class ChartOfAccountResolver {
  private readonly logger = new Logger(ChartOfAccountResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Query(() => ChartOfAccountDto, { nullable: true, name: 'chartOfAccount' })
  @UseGuards(JwtAuthGuard)
  async getChartOfAccount(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<ChartOfAccountDto | null> {
    this.logger.log(`Fetching account ${id} for user ${user.userId}`);
    return this.queryBus.execute(new GetAccountQuery(id));
  }

  @Query(() => [ChartOfAccountDto], { name: 'chartOfAccounts' })
  @UseGuards(JwtAuthGuard)
  async getChartOfAccounts(
    @CurrentUser() user: CurrentUserContext,
    @Args('accountType', { type: () => AccountType, nullable: true }) accountType?: AccountType,
    @Args('isActive', { nullable: true }) isActive?: boolean,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 100 }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset?: number,
  ): Promise<ChartOfAccountDto[]> {
    this.logger.log(
      `Fetching accounts for tenant ${user.tenantId} ` +
      `(type: ${accountType || 'all'}, active: ${isActive ?? 'all'}, limit: ${limit}, offset: ${offset})`
    );
    return this.queryBus.execute(
      new GetAccountsQuery(user.tenantId, accountType, isActive, limit, offset)
    );
  }

  @Query(() => ChartOfAccountDto, { nullable: true, name: 'accountByCode' })
  @UseGuards(JwtAuthGuard)
  async getAccountByCode(
    @Args('accountCode') accountCode: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<ChartOfAccountDto | null> {
    this.logger.log(`Fetching account by code: ${accountCode} for tenant ${user.tenantId}`);
    return this.queryBus.execute(new GetAccountByCodeQuery(accountCode, user.tenantId));
  }

  @Mutation(() => ChartOfAccountDto, { name: 'createAccount' })
  @UseGuards(JwtAuthGuard)
  async createAccount(
    @Args('input') input: CreateAccountInput,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<ChartOfAccountDto> {
    this.logger.log(`Creating account ${input.accountCode} (${input.accountName}) for user ${user.userId}`);

    const command = new CreateAccountCommand(
      input.accountCode,
      input.accountName,
      input.accountType,
      input.currency as any, // Currency type comes from GraphQL input as string
      user.tenantId,
      user.userId,
      input.parentAccountId,
    );

    const accountId = await this.commandBus.execute<CreateAccountCommand, string>(command);

    // Query the created account to return it
    const account = await this.queryBus.execute(new GetAccountQuery(accountId));
    if (!account) {
      throw new NotFoundException(`Account ${accountId} was created but could not be retrieved`);
    }

    return account;
  }

  @Mutation(() => ChartOfAccountDto, { name: 'deactivateAccount' })
  @UseGuards(JwtAuthGuard)
  async deactivateAccount(
    @Args('id', { type: () => ID }) id: string,
    @Args('reason') reason: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<ChartOfAccountDto> {
    this.logger.log(`Deactivating account ${id}, reason: ${reason}, user ${user.userId}`);

    const command = new DeactivateAccountCommand(id, reason, user.userId);
    await this.commandBus.execute(command);

    // Query the deactivated account to return it
    const account = await this.queryBus.execute(new GetAccountQuery(id));
    if (!account) {
      throw new NotFoundException(`Account ${id} not found after deactivation`);
    }

    return account;
  }
}
