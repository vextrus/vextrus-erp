import { InputType, Field } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';

/**
 * Fail Payment Input
 *
 * GraphQL input for marking a payment as failed.
 * Failure reason is required for audit trail and troubleshooting.
 */
@InputType()
export class FailPaymentInput {
  @Field()
  @IsString()
  @Length(10, 500, { message: 'reason must be between 10 and 500 characters for audit purposes' })
  reason!: string;
}
