import { InputType, Field, Float } from '@nestjs/graphql';
import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, IsDateString, Length, Min, Matches } from 'class-validator';
import { PaymentMethod, MobileWalletProvider } from '../dto/enums.dto';

/**
 * Create Payment Input
 *
 * GraphQL input for payment creation mutation.
 * Supports multiple payment methods including Bangladesh mobile wallets.
 *
 * Validation:
 * - Amount must be positive
 * - Mobile number must match Bangladesh format: 01[3-9]XXXXXXXX or +8801[3-9]XXXXXXXX
 * - Mobile wallet fields required for MOBILE_WALLET payment method
 * - Bank account ID required for BANK_TRANSFER payment method
 * - Check number required for CHECK payment method
 */
@InputType()
export class CreatePaymentInput {
  @Field()
  @IsUUID()
  invoiceId!: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01, { message: 'amount must be positive' })
  amount!: number;

  @Field()
  @IsString()
  @Length(3, 3, { message: 'currency must be 3-character code (e.g., BDT, USD)' })
  currency!: string;

  @Field(() => PaymentMethod)
  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  paymentMethod!: PaymentMethod;

  @Field()
  @IsDateString({}, { message: 'paymentDate must be a valid ISO 8601 date string' })
  paymentDate!: string;

  @Field({ nullable: true })
  @IsString()
  @Length(1, 255)
  @IsOptional()
  reference?: string;

  // Bank payment fields
  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  bankAccountId?: string;

  @Field({ nullable: true })
  @IsString()
  @Length(3, 50)
  @IsOptional()
  checkNumber?: string;

  // Mobile wallet fields
  @Field(() => MobileWalletProvider, { nullable: true })
  @IsEnum(MobileWalletProvider, { message: 'Invalid mobile wallet provider' })
  @IsOptional()
  walletProvider?: MobileWalletProvider;

  @Field({ nullable: true })
  @IsString()
  @Matches(/^(01[3-9]\d{8}|\+8801[3-9]\d{8})$/, {
    message: 'Mobile number must be valid Bangladesh format: 01[3-9]XXXXXXXX or +8801[3-9]XXXXXXXX',
  })
  @IsOptional()
  mobileNumber?: string;

  @Field({ nullable: true })
  @IsString()
  @Length(5, 100)
  @IsOptional()
  walletTransactionId?: string;

  @Field({ nullable: true })
  @IsString()
  @Length(1, 50)
  @IsOptional()
  merchantCode?: string;
}
