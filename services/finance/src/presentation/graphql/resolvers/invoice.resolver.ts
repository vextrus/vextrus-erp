import { Resolver, Query, Mutation, Args, ID, Int, ResolveField, Parent, ResolveReference } from '@nestjs/graphql';
import { UseGuards, Logger, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InvoiceDto } from '../dto/invoice.dto';
import { CreateInvoiceInput } from '../inputs/create-invoice.input';
import { UpdateInvoiceInput } from '../inputs/update-invoice.input';
import { JwtAuthGuard } from '../../../infrastructure/guards/jwt-auth.guard';
import { RbacGuard } from '../../../infrastructure/guards/rbac.guard';
import { Permissions } from '../../../infrastructure/decorators/permissions.decorator';
import { Public } from '../../../infrastructure/decorators/public.decorator';
import { CurrentUser, CurrentUserContext } from '../../../infrastructure/decorators/current-user.decorator';
import { CreateInvoiceCommand } from '../../../application/commands/create-invoice.command';
import { UpdateInvoiceCommand } from '../../../application/commands/update-invoice.command';
import { ApproveInvoiceCommand } from '../../../application/commands/approve-invoice.command';
import { CancelInvoiceCommand } from '../../../application/commands/cancel-invoice.command';
import { GetInvoiceQuery } from '../../../application/queries/get-invoice.query';
import { GetInvoicesQuery } from '../../../application/queries/get-invoices.query';
import { Money } from '../../../domain/value-objects/money.value-object';
import { LineItemDto } from '../../../domain/aggregates/invoice/invoice.aggregate';
import { MasterDataDataLoader } from '../../../infrastructure/integrations/master-data.dataloader';
import { Vendor, Customer } from '../../../infrastructure/integrations/master-data.client';

/**
 * Invoice GraphQL Resolver
 *
 * Provides GraphQL API for invoice management using CQRS pattern.
 * All mutations execute commands via CommandBus.
 * All queries execute queries via QueryBus.
 */
@Resolver(() => InvoiceDto)
export class InvoiceResolver {
  private readonly logger = new Logger(InvoiceResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly masterDataLoader: MasterDataDataLoader,
  ) {}

  /**
   * Apollo Federation Reference Resolver
   *
   * Enables cross-service entity resolution when other services reference Invoice by ID.
   * Required for GraphQL Federation v2 when @key directive is used.
   *
   * Example federation query:
   * query {
   *   payment(id: "123") {
   *     invoice { # <-- This triggers resolveReference
   *       id
   *       invoiceNumber
   *       grandTotal
   *     }
   *   }
   * }
   */
  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }): Promise<InvoiceDto | null> {
    this.logger.log(`Resolving Invoice reference for ID: ${reference.id}`);
    return this.queryBus.execute(new GetInvoiceQuery(reference.id));
  }

  @Query(() => InvoiceDto, { nullable: true, name: 'invoice' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('invoice:read')
  async getInvoice(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<InvoiceDto | null> {
    this.logger.log(`Fetching invoice ${id} for user ${user.userId} (tenant: ${user.tenantId})`);
    return this.queryBus.execute(new GetInvoiceQuery(id));
  }

  @Query(() => [InvoiceDto], { name: 'invoices' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('invoice:read')
  async getInvoices(
    @CurrentUser() user: CurrentUserContext,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset?: number,
  ): Promise<InvoiceDto[]> {
    this.logger.log(`Fetching invoices for tenant ${user.tenantId} (user: ${user.userId}, limit: ${limit}, offset: ${offset})`);
    return this.queryBus.execute(new GetInvoicesQuery(user.tenantId, limit, offset));
  }

  @Mutation(() => InvoiceDto, { name: 'createInvoice' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('invoice:create')
  async createInvoice(
    @Args('input') input: CreateInvoiceInput,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<InvoiceDto> {
    this.logger.log(`Creating invoice for customer ${input.customerId}, user ${user.userId}`);

    // Convert LineItemInput to LineItemDto (number → Money conversion)
    const lineItemDtos: LineItemDto[] = input.lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: Money.create(item.unitPrice, item.currency),
      vatCategory: item.vatCategory,
      hsCode: item.hsCode,
      supplementaryDutyRate: item.supplementaryDutyRate,
      advanceIncomeTaxRate: item.advanceIncomeTaxRate,
    } as LineItemDto));

    const command = new CreateInvoiceCommand(
      input.customerId,
      input.vendorId,
      new Date(input.invoiceDate),
      new Date(input.dueDate),
      lineItemDtos,
      user.tenantId,
      user.userId,
      input.vendorTIN,
      input.vendorBIN,
      input.customerTIN,
      input.customerBIN,
    );

    const invoiceId = await this.commandBus.execute<CreateInvoiceCommand, string>(command);

    // Query the created invoice to return it
    const invoice = await this.queryBus.execute(new GetInvoiceQuery(invoiceId));
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} was created but could not be retrieved`);
    }

    return invoice;
  }

  @Mutation(() => InvoiceDto, { name: 'updateInvoice' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('invoice:update')
  async updateInvoice(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateInvoiceInput,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<InvoiceDto> {
    this.logger.log(`Updating invoice ${id}, user ${user.userId}`);

    // Convert LineItemInput to LineItemDto (number → Money conversion) if provided
    const lineItemDtos: LineItemDto[] | undefined = input.lineItems?.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: Money.create(item.unitPrice, item.currency),
      vatCategory: item.vatCategory,
      hsCode: item.hsCode,
      supplementaryDutyRate: item.supplementaryDutyRate,
      advanceIncomeTaxRate: item.advanceIncomeTaxRate,
    } as LineItemDto));

    const command = new UpdateInvoiceCommand(
      id,
      user.userId,
      user.tenantId,
      input.customerId,
      input.vendorId,
      input.invoiceDate ? new Date(input.invoiceDate) : undefined,
      input.dueDate ? new Date(input.dueDate) : undefined,
      lineItemDtos,
      input.vendorTIN,
      input.vendorBIN,
      input.customerTIN,
      input.customerBIN,
    );

    await this.commandBus.execute(command);

    // Query the updated invoice to return it
    const invoice = await this.queryBus.execute(new GetInvoiceQuery(id));
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found after update`);
    }

    return invoice;
  }

  @Mutation(() => InvoiceDto, { name: 'approveInvoice' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('invoice:approve')
  async approveInvoice(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<InvoiceDto> {
    this.logger.log(`Approving invoice ${id}, user ${user.userId}`);

    const command = new ApproveInvoiceCommand(id, user.userId);
    await this.commandBus.execute(command);

    // Query the approved invoice to return it
    const invoice = await this.queryBus.execute(new GetInvoiceQuery(id));
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found after approval`);
    }

    return invoice;
  }

  @Mutation(() => InvoiceDto, { name: 'cancelInvoice' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('invoice:cancel')
  async cancelInvoice(
    @Args('id', { type: () => ID }) id: string,
    @Args('reason') reason: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<InvoiceDto> {
    this.logger.log(`Cancelling invoice ${id}, reason: ${reason}, user ${user.userId}`);

    const command = new CancelInvoiceCommand(id, reason, user.userId);
    await this.commandBus.execute(command);

    // Query the cancelled invoice to return it
    const invoice = await this.queryBus.execute(new GetInvoiceQuery(id));
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found after cancellation`);
    }

    return invoice;
  }
}
