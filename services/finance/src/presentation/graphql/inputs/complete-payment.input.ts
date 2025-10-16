import { InputType, Field } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';

/**
 * Complete Payment Input
 *
 * GraphQL input for completing a payment.
 * Used when payment processing is successful and transaction reference is received.
 */
@InputType()
export class CompletePaymentInput {
  @Field()
  @IsString()
  @Length(5, 255, { message: 'transactionReference must be between 5 and 255 characters' })
  transactionReference!: string;
}
