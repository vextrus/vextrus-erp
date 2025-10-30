import { InputType, Field, ID } from '@nestjs/graphql';

/**
 * Journal Line GraphQL Input
 *
 * Input type for journal line items in create/add journal mutations.
 * Each line must have either debit OR credit amount (not both).
 *
 * Validation:
 * - accountId: Required, must be valid chart of account
 * - debitAmount OR creditAmount: Required (exactly one must be provided)
 * - Amounts must be positive numbers
 * - Description, cost center, project, reference, taxCode: Optional
 */
@InputType('JournalLineInput')
export class JournalLineInput {
  @Field(() => ID)
  accountId!: string;

  @Field({ nullable: true })
  debitAmount?: number;

  @Field({ nullable: true })
  creditAmount?: number;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  costCenter?: string;

  @Field({ nullable: true })
  project?: string;

  @Field({ nullable: true })
  reference?: string;

  @Field({ nullable: true })
  taxCode?: string;
}
