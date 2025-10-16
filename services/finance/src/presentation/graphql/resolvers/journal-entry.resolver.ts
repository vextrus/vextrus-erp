import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards, Logger, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JournalEntryDto } from '../dto/journal-entry.dto';
import { JournalLineDto } from '../dto/journal-line.dto';
import { CreateJournalInput } from '../inputs/create-journal.input';
import { AddJournalLineInput } from '../inputs/add-journal-line.input';
import { JournalType, JournalStatus } from '../dto/enums.dto';
import { JwtAuthGuard } from '../../../infrastructure/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserContext } from '../../../infrastructure/decorators/current-user.decorator';
import { CreateJournalCommand } from '../../../application/commands/create-journal.command';
import { AddJournalLineCommand } from '../../../application/commands/add-journal-line.command';
import { PostJournalCommand } from '../../../application/commands/post-journal.command';
import { ReverseJournalCommand } from '../../../application/commands/reverse-journal.command';
import { GetJournalQuery } from '../../../application/queries/get-journal.query';
import { GetJournalsQuery } from '../../../application/queries/get-journals.query';
import { GetJournalsByPeriodQuery } from '../../../application/queries/get-journals-by-period.query';
import { GetUnpostedJournalsQuery } from '../../../application/queries/get-unposted-journals.query';
import { JournalEntryReadModel } from '../../../infrastructure/persistence/typeorm/entities/journal-entry.entity';

/**
 * Journal Entry GraphQL Resolver
 *
 * Provides GraphQL API for journal entry management using CQRS pattern.
 * All mutations execute commands via CommandBus.
 * All queries execute queries via QueryBus.
 *
 * Mutations:
 * - createJournal: Create new journal entry with lines
 * - addJournalLine: Add line to existing DRAFT journal
 * - postJournal: Post journal to ledger (makes immutable)
 * - reverseJournal: Create reversing journal (swaps debits/credits)
 *
 * Queries:
 * - journal: Get single journal by ID
 * - journals: Get journals with filters (type, status, fiscalPeriod)
 * - journalsByPeriod: Get all journals for fiscal period
 * - unpostedJournals: Get all DRAFT journals
 *
 * Bangladesh Features:
 * - Fiscal period calculation (July-June fiscal year)
 * - Journal number generation per type and date
 * - Double-entry bookkeeping validation
 * - 9 journal types (GENERAL, SALES, PURCHASE, etc.)
 * - Cost center and project tracking
 */
@Resolver(() => JournalEntryDto)
export class JournalEntryResolver {
  private readonly logger = new Logger(JournalEntryResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Query: Get single journal by ID
   */
  @Query(() => JournalEntryDto, { nullable: true, name: 'journal' })
  @UseGuards(JwtAuthGuard)
  async getJournal(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<JournalEntryDto | null> {
    this.logger.log(`Fetching journal ${id} for user ${user.userId}`);

    const journal = await this.queryBus.execute<GetJournalQuery, JournalEntryReadModel | null>(
      new GetJournalQuery(id)
    );

    if (!journal) {
      return null;
    }

    return this.mapToDto(journal);
  }

  /**
   * Query: Get journals with optional filters
   */
  @Query(() => [JournalEntryDto], { name: 'journals' })
  @UseGuards(JwtAuthGuard)
  async getJournals(
    @CurrentUser() user: CurrentUserContext,
    @Args('journalType', { type: () => JournalType, nullable: true }) journalType?: JournalType,
    @Args('status', { type: () => JournalStatus, nullable: true }) status?: JournalStatus,
    @Args('fiscalPeriod', { nullable: true }) fiscalPeriod?: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset?: number,
  ): Promise<JournalEntryDto[]> {
    this.logger.log(
      `Fetching journals for tenant ${user.tenantId} ` +
      `(type: ${journalType || 'all'}, status: ${status || 'all'}, ` +
      `period: ${fiscalPeriod || 'all'}, limit: ${limit}, offset: ${offset})`
    );

    const journals = await this.queryBus.execute<GetJournalsQuery, JournalEntryReadModel[]>(
      new GetJournalsQuery(user.tenantId, journalType, status, fiscalPeriod, limit, offset)
    );

    return journals.map(journal => this.mapToDto(journal));
  }

  /**
   * Query: Get all journals for specific fiscal period
   */
  @Query(() => [JournalEntryDto], { name: 'journalsByPeriod' })
  @UseGuards(JwtAuthGuard)
  async getJournalsByPeriod(
    @Args('fiscalPeriod') fiscalPeriod: string,
    @CurrentUser() user: CurrentUserContext,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 100 }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset?: number,
  ): Promise<JournalEntryDto[]> {
    this.logger.log(
      `Fetching journals for period ${fiscalPeriod}, tenant ${user.tenantId} ` +
      `(limit: ${limit}, offset: ${offset})`
    );

    const journals = await this.queryBus.execute<GetJournalsByPeriodQuery, JournalEntryReadModel[]>(
      new GetJournalsByPeriodQuery(fiscalPeriod, user.tenantId, limit, offset)
    );

    return journals.map(journal => this.mapToDto(journal));
  }

  /**
   * Query: Get unposted journals (DRAFT status)
   */
  @Query(() => [JournalEntryDto], { name: 'unpostedJournals' })
  @UseGuards(JwtAuthGuard)
  async getUnpostedJournals(
    @CurrentUser() user: CurrentUserContext,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 100 }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset?: number,
  ): Promise<JournalEntryDto[]> {
    this.logger.log(
      `Fetching unposted journals for tenant ${user.tenantId} ` +
      `(limit: ${limit}, offset: ${offset})`
    );

    const journals = await this.queryBus.execute<GetUnpostedJournalsQuery, JournalEntryReadModel[]>(
      new GetUnpostedJournalsQuery(user.tenantId, limit, offset)
    );

    return journals.map(journal => this.mapToDto(journal));
  }

  /**
   * Mutation: Create new journal entry
   */
  @Mutation(() => JournalEntryDto, { name: 'createJournal' })
  @UseGuards(JwtAuthGuard)
  async createJournal(
    @Args('input') input: CreateJournalInput,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<JournalEntryDto> {
    this.logger.log(
      `Creating journal for date ${input.journalDate}, type ${input.journalType || 'GENERAL'}, ` +
      `lines ${input.lines.length}, autoPost ${input.autoPost || false}, user ${user.userId}`
    );

    const command = new CreateJournalCommand(
      new Date(input.journalDate),
      input.description,
      user.tenantId,
      user.userId,
      input.lines,
      input.journalType,
      input.reference,
      input.autoPost,
    );

    const journalId = await this.commandBus.execute<CreateJournalCommand, string>(command);

    // Query the created journal to return it
    const journal = await this.queryBus.execute<GetJournalQuery, JournalEntryReadModel | null>(
      new GetJournalQuery(journalId)
    );

    if (!journal) {
      throw new NotFoundException(`Journal ${journalId} was created but could not be retrieved`);
    }

    return this.mapToDto(journal);
  }

  /**
   * Mutation: Add line to existing DRAFT journal
   */
  @Mutation(() => JournalEntryDto, { name: 'addJournalLine' })
  @UseGuards(JwtAuthGuard)
  async addJournalLine(
    @Args('journalId', { type: () => ID }) journalId: string,
    @Args('input') input: AddJournalLineInput,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<JournalEntryDto> {
    this.logger.log(
      `Adding line to journal ${journalId}, account ${input.accountId}, ` +
      `debit ${input.debitAmount || 0}, credit ${input.creditAmount || 0}, user ${user.userId}`
    );

    const command = new AddJournalLineCommand(
      journalId,
      input.accountId,
      user.tenantId,
      input.debitAmount,
      input.creditAmount,
      input.description,
      input.costCenter,
      input.project,
      input.reference,
      input.taxCode,
    );

    await this.commandBus.execute(command);

    // Query the updated journal to return it
    const journal = await this.queryBus.execute<GetJournalQuery, JournalEntryReadModel | null>(
      new GetJournalQuery(journalId)
    );

    if (!journal) {
      throw new NotFoundException(`Journal ${journalId} not found after adding line`);
    }

    return this.mapToDto(journal);
  }

  /**
   * Mutation: Post journal to ledger
   */
  @Mutation(() => JournalEntryDto, { name: 'postJournal' })
  @UseGuards(JwtAuthGuard)
  async postJournal(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<JournalEntryDto> {
    this.logger.log(`Posting journal ${id}, user ${user.userId}`);

    const command = new PostJournalCommand(id, user.userId, user.tenantId);
    await this.commandBus.execute(command);

    // Query the posted journal to return it
    const journal = await this.queryBus.execute<GetJournalQuery, JournalEntryReadModel | null>(
      new GetJournalQuery(id)
    );

    if (!journal) {
      throw new NotFoundException(`Journal ${id} not found after posting`);
    }

    return this.mapToDto(journal);
  }

  /**
   * Mutation: Reverse posted journal
   */
  @Mutation(() => JournalEntryDto, { name: 'reverseJournal' })
  @UseGuards(JwtAuthGuard)
  async reverseJournal(
    @Args('id', { type: () => ID }) id: string,
    @Args('reversingDate') reversingDate: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<JournalEntryDto> {
    this.logger.log(
      `Reversing journal ${id} with date ${reversingDate}, user ${user.userId}`
    );

    const command = new ReverseJournalCommand(
      id,
      new Date(reversingDate),
      user.userId,
      user.tenantId,
    );

    const reversingJournalId = await this.commandBus.execute<ReverseJournalCommand, string>(command);

    // Query the reversing journal to return it
    const journal = await this.queryBus.execute<GetJournalQuery, JournalEntryReadModel | null>(
      new GetJournalQuery(reversingJournalId)
    );

    if (!journal) {
      throw new NotFoundException(`Reversing journal ${reversingJournalId} not found`);
    }

    return this.mapToDto(journal);
  }

  /**
   * Map JournalEntryReadModel to JournalEntryDto
   * Converts database entity to GraphQL DTO format
   */
  private mapToDto(journal: JournalEntryReadModel): JournalEntryDto {
    const dto: JournalEntryDto = {
      id: journal.id,
      journalNumber: journal.journalNumber,
      journalDate: journal.journalDate,
      journalType: journal.journalType as JournalType,
      description: journal.description,
      reference: journal.reference,
      lines: journal.lines.map(line => ({
        lineId: line.lineId,
        accountId: line.accountId,
        debitAmount: line.debitAmount,
        creditAmount: line.creditAmount,
        description: line.description,
        costCenter: line.costCenter,
        project: line.project,
        reference: line.reference,
        taxCode: line.taxCode,
      } as JournalLineDto)),
      totalDebit: journal.totalDebit,
      totalCredit: journal.totalCredit,
      currency: journal.currency,
      status: journal.status as JournalStatus,
      fiscalPeriod: journal.fiscalPeriod,
      isReversing: journal.isReversing,
      originalJournalId: journal.originalJournalId,
      postedAt: journal.postedAt,
      postedBy: journal.postedBy,
      createdAt: journal.createdAt,
      updatedAt: journal.updatedAt,
    };

    return dto;
  }
}
