import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards, Logger, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InvoiceDto } from '../dto/invoice.dto';
import { CreateInvoiceInput } from '../inputs/create-invoice.input';
import { JwtAuthGuard } from '../../../infrastructure/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserContext } from '../../../infrastructure/decorators/current-user.decorator';
import { CreateInvoiceCommand } from '../../../application/commands/create-invoice.command';
import { ApproveInvoiceCommand } from '../../../application/commands/approve-invoice.command';
import { CancelInvoiceCommand } from '../../../application/commands/cancel-invoice.command';
import { GetInvoiceQuery } from '../../../application/queries/get-invoice.query';
import { GetInvoicesQuery } from '../../../application/queries/get-invoices.query';
import { Money } from '../../../domain/value-objects/money.value-object';
import { LineItemDto } from '../../../domain/aggregates/invoice/invoice.aggregate';

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
  ) {}

  @Query(() => InvoiceDto, { nullable: true, name: 'invoice' })
  @UseGuards(JwtAuthGuard)
  async getInvoice(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<InvoiceDto | null> {
    this.logger.log(`Fetching invoice ${id} for user ${user.userId}`);
    return this.queryBus.execute(new GetInvoiceQuery(id));
  }

  @Query(() => [InvoiceDto], { name: 'invoices' })
  @UseGuards(JwtAuthGuard)
  async getInvoices(
    @CurrentUser() user: CurrentUserContext,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset?: number,
  ): Promise<InvoiceDto[]> {
    this.logger.log(`Fetching invoices for tenant ${user.tenantId} (limit: ${limit}, offset: ${offset})`);
    return this.queryBus.execute(new GetInvoicesQuery(user.tenantId, limit, offset));
  }

  @Mutation(() => InvoiceDto, { name: 'createInvoice' })
  @UseGuards(JwtAuthGuard)
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

  @Mutation(() => InvoiceDto, { name: 'approveInvoice' })
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
