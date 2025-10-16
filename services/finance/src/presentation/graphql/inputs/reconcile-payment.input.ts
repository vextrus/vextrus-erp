import { InputType, Field } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';

/**
 * Reconcile Payment Input
 *
 * GraphQL input for reconciling a payment with bank statement transaction.
 * Bank transaction ID is required for matching.
 */
@InputType()
export class ReconcilePaymentInput {
  @Field()
  @IsString()
  @Length(5, 100, { message: 'bankStatementTransactionId must be between 5 and 100 characters' })
  bankStatementTransactionId!: string;
}
