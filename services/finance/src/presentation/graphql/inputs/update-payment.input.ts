import { InputType, Field, Float } from '@nestjs/graphql';
import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, IsDateString, Length, Min } from 'class-validator';
import { PaymentMethod } from '../dto/enums.dto';

/**
 * Update Payment GraphQL Input
 *
 * All fields are optional to support partial updates.
 * Only PENDING payments can be updated.
 *
 * Note: Mobile wallet details cannot be updated after creation.
 * To change mobile wallet, create a new payment and cancel the old one.
 */
@InputType()
export class UpdatePaymentInput {
  @Field(() => Float, { nullable: true })
  @IsNumber()
  @Min(0.01, { message: 'amount must be positive' })
  @IsOptional()
  amount?: number;

  @Field({ nullable: true })
  @IsString()
  @Length(3, 3, { message: 'currency must be 3-character code (e.g., BDT, USD)' })
  @IsOptional()
  currency?: string;

  @Field({ nullable: true })
  @IsDateString({}, { message: 'paymentDate must be a valid ISO 8601 date string' })
  @IsOptional()
  paymentDate?: string;

  @Field(() => PaymentMethod, { nullable: true })
  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @Field({ nullable: true })
  @IsString()
  @Length(1, 255)
  @IsOptional()
  reference?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  bankAccountId?: string;

  @Field({ nullable: true })
  @IsString()
  @Length(3, 50)
  @IsOptional()
  checkNumber?: string;
}
