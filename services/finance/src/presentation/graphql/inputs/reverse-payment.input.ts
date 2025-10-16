import { InputType, Field } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';

/**
 * Reverse Payment Input
 *
 * GraphQL input for reversing a completed or reconciled payment.
 * Reversal reason is required for audit trail.
 */
@InputType()
export class ReversePaymentInput {
  @Field()
  @IsString()
  @Length(10, 500, { message: 'reason must be between 10 and 500 characters for audit purposes' })
  reason!: string;
}
