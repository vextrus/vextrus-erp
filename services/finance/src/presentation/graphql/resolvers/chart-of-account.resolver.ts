import { Resolver, Query, Mutation, Args, ID, Int, ResolveReference } from '@nestjs/graphql';
import { UseGuards, Logger, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ChartOfAccountDto } from '../dto/chart-of-account.dto';
import { CreateAccountInput } from '../inputs/create-account.input';
import { UpdateAccountInput } from '../inputs/update-account.input';
import { AccountType } from '../dto/enums.dto';
import { JwtAuthGuard } from '../../../infrastructure/guards/jwt-auth.guard';
import { RbacGuard } from '../../../infrastructure/guards/rbac.guard';
import { Permissions } from '../../../infrastructure/decorators/permissions.decorator';
import { Public } from '../../../infrastructure/decorators/public.decorator';
import { CurrentUser, CurrentUserContext } from '../../../infrastructure/decorators/current-user.decorator';
import { CreateAccountCommand } from '../../../application/commands/create-account.command';
import { UpdateAccountCommand } from '../../../application/commands/update-account.command';
import { DeactivateAccountCommand } from '../../../application/commands/deactivate-account.command';
import { GetAccountQuery } from '../../../application/queries/get-account.query';
import { GetAccountsQuery } from '../../../application/queries/get-accounts.query';
import { GetAccountByCodeQuery } from '../../../application/queries/get-account-by-code.query';
import { GetTrialBalanceQuery } from '../../../application/queries/get-trial-balance.query';
import { TrialBalanceType } from '../types/trial-balance.type';
import { GetTrialBalanceInput } from '../inputs/get-trial-balance.input';

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

  /**
   * Apollo Federation Reference Resolver
   *
   * Enables cross-service entity resolution when other services reference ChartOfAccount by ID.
   * Required for GraphQL Federation v2 when @key directive is used.
   *
   * Example federation query:
   * query {
   *   journalEntry(id: "123") {
   *     lines {
   *       account { # <-- This triggers resolveReference
   *         id
   *         accountCode
   *         accountName
   *         accountType
   *       }
   *     }
   *   }
   * }
   */
  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }): Promise<ChartOfAccountDto | null> {
    this.logger.log(`Resolving ChartOfAccount reference for ID: ${reference.id}`);
    return this.queryBus.execute(new GetAccountQuery(reference.id));
  }

  @Query(() => ChartOfAccountDto, { nullable: true, name: 'chartOfAccount' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('account:read')
  async getChartOfAccount(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<ChartOfAccountDto | null> {
    this.logger.log(`Fetching account ${id} for user ${user.userId}`);
    return this.queryBus.execute(new GetAccountQuery(id));
  }

  @Query(() => [ChartOfAccountDto], { name: 'chartOfAccounts' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('account:read')
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
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('account:read')
  async getAccountByCode(
    @Args('accountCode') accountCode: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<ChartOfAccountDto | null> {
    this.logger.log(`Fetching account by code: ${accountCode} for tenant ${user.tenantId}`);
    return this.queryBus.execute(new GetAccountByCodeQuery(accountCode, user.tenantId));
  }

  /**
   * Get Trial Balance Report
   *
   * Generates trial balance for a fiscal year showing all account balances.
   * Verifies double-entry accounting (debits = credits).
   *
   * Bangladesh Fiscal Year:
   * - FY2024-2025: July 1, 2024 → June 30, 2025
   * - Compatible with NBR reporting
   *
   * Performance:
   * - Cached for 30 minutes
   * - <500ms without cache, <50ms with cache HIT
   */
  @Query(() => TrialBalanceType, { name: 'trialBalance' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('finance:trial-balance:view')
  async getTrialBalance(
    @Args('input') input: GetTrialBalanceInput,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<TrialBalanceType> {
    this.logger.log(
      `Generating trial balance for ${input.fiscalYear} (tenant: ${user.tenantId})`,
    );

    return this.queryBus.execute(
      new GetTrialBalanceQuery(
        user.tenantId,
        input.fiscalYear,
        input.asOfDate,
      ),
    );
  }

  @Mutation(() => ChartOfAccountDto, { name: 'createAccount' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('account:create')
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

  @Mutation(() => ChartOfAccountDto, { name: 'updateAccount' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('account:update')
  async updateAccount(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateAccountInput,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<ChartOfAccountDto> {
    this.logger.log(`Updating account ${id}, user ${user.userId}`);

    const command = new UpdateAccountCommand(
      id,
      user.userId,
      user.tenantId,
      input.accountName,
      input.parentAccountId,
    );

    await this.commandBus.execute(command);

    // Query the updated account to return it
    const account = await this.queryBus.execute(new GetAccountQuery(id));
    if (!account) {
      throw new NotFoundException(`Account ${id} not found after update`);
    }

    return account;
  }

  @Mutation(() => ChartOfAccountDto, { name: 'deactivateAccount' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('account:deactivate')
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
