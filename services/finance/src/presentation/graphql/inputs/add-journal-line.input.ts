import { InputType, Field, ID } from '@nestjs/graphql';

/**
 * Add Journal Line GraphQL Input
 *
 * Input type for adding a line to an existing DRAFT journal entry.
 * Used for building journal entries incrementally.
 *
 * Business Rules:
 * - Journal must be in DRAFT status
 * - Line must have either debit OR credit (not both)
 * - Amounts must be positive
 * - Account ID must be valid
 */
@InputType('AddJournalLineInput')
export class AddJournalLineInput {
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
