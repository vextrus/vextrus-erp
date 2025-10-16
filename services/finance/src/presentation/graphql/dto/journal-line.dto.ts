import { ObjectType, Field, ID } from '@nestjs/graphql';

/**
 * Journal Line GraphQL DTO
 *
 * Represents a single line item in a journal entry.
 * Each line has either a debit OR credit amount (not both) following double-entry bookkeeping.
 *
 * Fields:
 * - lineId: Unique identifier for the line
 * - accountId: Reference to chart of account
 * - debitAmount: Debit amount (0 if credit side)
 * - creditAmount: Credit amount (0 if debit side)
 * - description: Line-specific description (optional)
 * - costCenter: Cost center allocation (optional)
 * - project: Project allocation (optional)
 * - reference: Line-specific reference (optional)
 * - taxCode: Tax code for tax calculation (optional)
 */
@ObjectType('JournalLine')
export class JournalLineDto {
  @Field(() => ID)
  lineId!: string;

  @Field(() => ID)
  accountId!: string;

  @Field()
  debitAmount!: number;

  @Field()
  creditAmount!: number;

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
