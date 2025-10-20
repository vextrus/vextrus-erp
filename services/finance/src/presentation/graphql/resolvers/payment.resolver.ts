import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards, Logger, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaymentDto, MobileWalletDto } from '../dto/payment.dto';
import { CreatePaymentInput } from '../inputs/create-payment.input';
import { CompletePaymentInput } from '../inputs/complete-payment.input';
import { FailPaymentInput } from '../inputs/fail-payment.input';
import { ReconcilePaymentInput } from '../inputs/reconcile-payment.input';
import { ReversePaymentInput } from '../inputs/reverse-payment.input';
import { JwtAuthGuard } from '../../../infrastructure/guards/jwt-auth.guard';
import { RbacGuard } from '../../../infrastructure/guards/rbac.guard';
import { Permissions } from '../../../infrastructure/decorators/permissions.decorator';
import { Public } from '../../../infrastructure/decorators/public.decorator';
import { CurrentUser, CurrentUserContext } from '../../../infrastructure/decorators/current-user.decorator';
import { CreatePaymentCommand } from '../../../application/commands/create-payment.command';
import { CompletePaymentCommand } from '../../../application/commands/complete-payment.command';
import { FailPaymentCommand } from '../../../application/commands/fail-payment.command';
import { ReconcilePaymentCommand } from '../../../application/commands/reconcile-payment.command';
import { ReversePaymentCommand } from '../../../application/commands/reverse-payment.command';
import { GetPaymentQuery } from '../../../application/queries/get-payment.query';
import { GetPaymentsQuery } from '../../../application/queries/get-payments.query';
import { GetPaymentsByInvoiceQuery } from '../../../application/queries/get-payments-by-invoice.query';
import { GetPaymentsByStatusQuery } from '../../../application/queries/get-payments-by-status.query';
import { PaymentReadModel } from '../../../infrastructure/persistence/typeorm/entities/payment.entity';
import { PaymentStatus, PaymentMethod } from '../dto/enums.dto';
import { MoneyDto } from '../dto/money.dto';

/**
 * Payment GraphQL Resolver
 *
 * Provides GraphQL API for payment management using CQRS pattern.
 * All mutations execute commands via CommandBus.
 * All queries execute queries via QueryBus.
 *
 * Mutations:
 * - createPayment: Create new payment
 * - completePayment: Mark payment as completed
 * - failPayment: Mark payment as failed
 * - reconcilePayment: Reconcile payment with bank statement
 * - reversePayment: Reverse completed/reconciled payment
 *
 * Queries:
 * - payment: Get single payment by ID
 * - payments: Get payments with filters (invoiceId, status, paymentMethod)
 * - paymentsByInvoice: Get all payments for specific invoice
 * - paymentsByStatus: Get payments by status (PENDING, FAILED, etc.)
 */
@Resolver(() => PaymentDto)
export class PaymentResolver {
  private readonly logger = new Logger(PaymentResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Query: Get single payment by ID
   */
  @Query(() => PaymentDto, { nullable: true, name: 'payment' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('payment:read')
  async getPayment(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<PaymentDto | null> {
    this.logger.log(`Fetching payment ${id} for user ${user.userId}`);

    const payment = await this.queryBus.execute<GetPaymentQuery, PaymentReadModel | null>(
      new GetPaymentQuery(id)
    );

    if (!payment) {
      return null;
    }

    return this.mapToDto(payment);
  }

  /**
   * Query: Get payments with optional filters
   */
  @Query(() => [PaymentDto], { name: 'payments' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('payment:read')
  async getPayments(
    @CurrentUser() user: CurrentUserContext,
    @Args('invoiceId', { nullable: true }) invoiceId?: string,
    @Args('status', { type: () => PaymentStatus, nullable: true }) status?: PaymentStatus,
    @Args('paymentMethod', { type: () => PaymentMethod, nullable: true }) paymentMethod?: PaymentMethod,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset?: number,
  ): Promise<PaymentDto[]> {
    this.logger.log(
      `Fetching payments for tenant ${user.tenantId} (invoiceId: ${invoiceId}, status: ${status}, ` +
      `paymentMethod: ${paymentMethod}, limit: ${limit}, offset: ${offset})`
    );

    const payments = await this.queryBus.execute<GetPaymentsQuery, PaymentReadModel[]>(
      new GetPaymentsQuery(user.tenantId, invoiceId, status, paymentMethod, limit, offset)
    );

    return payments.map(payment => this.mapToDto(payment));
  }

  /**
   * Query: Get all payments for specific invoice
   */
  @Query(() => [PaymentDto], { name: 'paymentsByInvoice' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('payment:read')
  async getPaymentsByInvoice(
    @Args('invoiceId', { type: () => ID }) invoiceId: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<PaymentDto[]> {
    this.logger.log(`Fetching payments for invoice ${invoiceId}, tenant ${user.tenantId}`);

    const payments = await this.queryBus.execute<GetPaymentsByInvoiceQuery, PaymentReadModel[]>(
      new GetPaymentsByInvoiceQuery(invoiceId, user.tenantId)
    );

    return payments.map(payment => this.mapToDto(payment));
  }

  /**
   * Query: Get payments by status
   */
  @Query(() => [PaymentDto], { name: 'paymentsByStatus' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('payment:read')
  async getPaymentsByStatus(
    @Args('status', { type: () => PaymentStatus }) status: PaymentStatus,
    @CurrentUser() user: CurrentUserContext,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset?: number,
  ): Promise<PaymentDto[]> {
    this.logger.log(
      `Fetching payments with status ${status} for tenant ${user.tenantId} (limit: ${limit}, offset: ${offset})`
    );

    const payments = await this.queryBus.execute<GetPaymentsByStatusQuery, PaymentReadModel[]>(
      new GetPaymentsByStatusQuery(status, user.tenantId, limit, offset)
    );

    return payments.map(payment => this.mapToDto(payment));
  }

  /**
   * Mutation: Create new payment
   */
  @Mutation(() => PaymentDto, { name: 'createPayment' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('payment:create')
  async createPayment(
    @Args('input') input: CreatePaymentInput,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<PaymentDto> {
    this.logger.log(
      `Creating payment for invoice ${input.invoiceId}, amount ${input.amount} ${input.currency}, ` +
      `method ${input.paymentMethod}, user ${user.userId}`
    );

    const command = new CreatePaymentCommand(
      input.invoiceId,
      input.amount,
      input.currency,
      input.paymentMethod,
      new Date(input.paymentDate),
      user.tenantId,
      user.userId,
      input.reference,
      input.bankAccountId,
      input.checkNumber,
      input.walletProvider,
      input.mobileNumber,
      input.walletTransactionId,
      input.merchantCode,
    );

    const paymentId = await this.commandBus.execute<CreatePaymentCommand, string>(command);

    // Query the created payment to return it
    const payment = await this.queryBus.execute<GetPaymentQuery, PaymentReadModel | null>(
      new GetPaymentQuery(paymentId)
    );

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} was created but could not be retrieved`);
    }

    return this.mapToDto(payment);
  }

  /**
   * Mutation: Complete payment
   */
  @Mutation(() => PaymentDto, { name: 'completePayment' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('payment:process')
  async completePayment(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: CompletePaymentInput,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<PaymentDto> {
    this.logger.log(`Completing payment ${id}, user ${user.userId}`);

    const command = new CompletePaymentCommand(id, input.transactionReference, user.userId);
    await this.commandBus.execute(command);

    // Query the completed payment to return it
    const payment = await this.queryBus.execute<GetPaymentQuery, PaymentReadModel | null>(
      new GetPaymentQuery(id)
    );

    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found after completion`);
    }

    return this.mapToDto(payment);
  }

  /**
   * Mutation: Fail payment
   */
  @Mutation(() => PaymentDto, { name: 'failPayment' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('payment:process')
  async failPayment(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: FailPaymentInput,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<PaymentDto> {
    this.logger.log(`Failing payment ${id}, reason: ${input.reason}, user ${user.userId}`);

    const command = new FailPaymentCommand(id, input.reason, user.userId);
    await this.commandBus.execute(command);

    // Query the failed payment to return it
    const payment = await this.queryBus.execute<GetPaymentQuery, PaymentReadModel | null>(
      new GetPaymentQuery(id)
    );

    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found after failure`);
    }

    return this.mapToDto(payment);
  }

  /**
   * Mutation: Reconcile payment with bank statement
   */
  @Mutation(() => PaymentDto, { name: 'reconcilePayment' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('payment:reconcile')
  async reconcilePayment(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: ReconcilePaymentInput,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<PaymentDto> {
    this.logger.log(
      `Reconciling payment ${id} with bank transaction ${input.bankStatementTransactionId}, user ${user.userId}`
    );

    const command = new ReconcilePaymentCommand(id, input.bankStatementTransactionId, user.userId);
    await this.commandBus.execute(command);

    // Query the reconciled payment to return it
    const payment = await this.queryBus.execute<GetPaymentQuery, PaymentReadModel | null>(
      new GetPaymentQuery(id)
    );

    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found after reconciliation`);
    }

    return this.mapToDto(payment);
  }

  /**
   * Mutation: Reverse payment (refund/chargeback)
   */
  @Mutation(() => PaymentDto, { name: 'reversePayment' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('payment:refund')
  async reversePayment(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: ReversePaymentInput,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<PaymentDto> {
    this.logger.log(`Reversing payment ${id}, reason: ${input.reason}, user ${user.userId}`);

    const command = new ReversePaymentCommand(id, input.reason, user.userId);
    await this.commandBus.execute(command);

    // Query the reversed payment to return it
    const payment = await this.queryBus.execute<GetPaymentQuery, PaymentReadModel | null>(
      new GetPaymentQuery(id)
    );

    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found after reversal`);
    }

    return this.mapToDto(payment);
  }

  /**
   * Map PaymentReadModel to PaymentDto
   * Converts database entity to GraphQL DTO format
   */
  private mapToDto(payment: PaymentReadModel): PaymentDto {
    const dto: PaymentDto = {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      invoiceId: payment.invoiceId,
      amount: {
        amount: payment.amount,
        currency: payment.currency,
      } as MoneyDto,
      paymentMethod: payment.paymentMethod as PaymentMethod,
      bankAccountId: payment.bankAccountId,
      checkNumber: payment.checkNumber,
      mobileWallet: payment.mobileWalletProvider ? {
        provider: payment.mobileWalletProvider as any,
        mobileNumber: payment.mobileNumber!,
        transactionId: payment.walletTransactionId!,
        merchantCode: payment.merchantCode,
      } as MobileWalletDto : undefined,
      status: payment.status as PaymentStatus,
      paymentDate: payment.paymentDate,
      reference: payment.reference,
      transactionReference: payment.transactionReference,
      reconciledAt: payment.reconciledAt,
      reconciledBy: payment.reconciledBy,
      bankTransactionId: payment.bankTransactionId,
      reversedAt: payment.reversedAt,
      reversedBy: payment.reversedBy,
      reversalReason: payment.reversalReason,
      failureReason: payment.failureReason,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };

    return dto;
  }
}
