import { InputType, Field } from '@nestjs/graphql';
import { JournalType } from '../dto/enums.dto';
import { JournalLineInput } from './journal-line.input';

/**
 * Create Journal GraphQL Input
 *
 * Input type for creating a new journal entry via GraphQL mutation.
 * Validates double-entry bookkeeping requirements.
 *
 * Business Rules:
 * - Must have at least 2 lines (double-entry bookkeeping)
 * - Each line must have either debit OR credit (not both)
 * - Total debits must equal total credits (balanced entry)
 * - Journal date must be in open accounting period
 *
 * Bangladesh Features:
 * - Fiscal period calculated from journal date (July-June fiscal year)
 * - Journal number auto-generated per type and date
 * - Support for 9 journal types (GENERAL, SALES, PURCHASE, etc.)
 */
@InputType('CreateJournalInput')
export class CreateJournalInput {
  @Field()
  journalDate!: string; // ISO date string (YYYY-MM-DD)

  @Field(() => JournalType, { nullable: true, defaultValue: JournalType.GENERAL })
  journalType?: JournalType;

  @Field()
  description!: string;

  @Field({ nullable: true })
  reference?: string;

  @Field(() => [JournalLineInput])
  lines!: JournalLineInput[];

  @Field({ nullable: true, defaultValue: false })
  autoPost?: boolean;
}
