import { ObjectType, Field, ID, Float, Directive } from '@nestjs/graphql';
import { MoneyDto } from './money.dto';
import { PaymentStatus, PaymentMethod, MobileWalletProvider } from './enums.dto';

/**
 * Mobile Wallet Details DTO
 *
 * Bangladesh mobile wallet payment details
 * Providers: bKash, Nagad, Rocket, Upay, SureCash, mCash, tCash
 */
@ObjectType('MobileWallet')
export class MobileWalletDto {
  @Field(() => MobileWalletProvider)
  provider!: MobileWalletProvider;

  @Field()
  mobileNumber!: string;

  @Field()
  transactionId!: string;

  @Field({ nullable: true })
  merchantCode?: string;
}

/**
 * Payment DTO
 *
 * GraphQL type for payment queries.
 * Contains all payment details including Bangladesh mobile wallet integration.
 *
 * Bangladesh Features:
 * - Mobile wallet support (bKash, Nagad, etc.)
 * - Payment number format: PMT-YYYY-MM-DD-NNNNNN
 * - Multi-status lifecycle (PENDING → PROCESSING → COMPLETED → RECONCILED)
 * - Reversal support for refunds/chargebacks
 */
@ObjectType('Payment')
@Directive('@key(fields: "id")')
export class PaymentDto {
  @Field(() => ID)
  id!: string;

  @Field()
  paymentNumber!: string;

  @Field(() => ID)
  invoiceId!: string;

  @Field(() => MoneyDto)
  amount!: MoneyDto;

  @Field(() => PaymentMethod)
  paymentMethod!: PaymentMethod;

  @Field(() => ID, { nullable: true })
  bankAccountId?: string;

  @Field({ nullable: true })
  checkNumber?: string;

  @Field(() => MobileWalletDto, { nullable: true })
  mobileWallet?: MobileWalletDto;

  @Field(() => PaymentStatus)
  status!: PaymentStatus;

  @Field()
  paymentDate!: Date;

  @Field({ nullable: true })
  reference?: string;

  @Field({ nullable: true })
  transactionReference?: string;

  @Field({ nullable: true })
  reconciledAt?: Date;

  @Field(() => ID, { nullable: true })
  reconciledBy?: string;

  @Field({ nullable: true })
  bankTransactionId?: string;

  @Field({ nullable: true })
  reversedAt?: Date;

  @Field(() => ID, { nullable: true })
  reversedBy?: string;

  @Field({ nullable: true })
  reversalReason?: string;

  @Field({ nullable: true })
  failureReason?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
