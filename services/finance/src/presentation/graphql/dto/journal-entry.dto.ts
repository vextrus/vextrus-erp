import { ObjectType, Field, ID } from '@nestjs/graphql';
import { JournalType, JournalStatus } from './enums.dto';
import { JournalLineDto } from './journal-line.dto';

/**
 * Journal Entry GraphQL DTO
 *
 * Represents a journal entry in the GraphQL API.
 * Used for query responses in the CQRS read side.
 *
 * Bangladesh Features:
 * - Fiscal period: FY2024-2025-P01 format (July-June fiscal year)
 * - Journal number: {TYPE}-YYYY-MM-NNNNNN format
 * - Double-entry bookkeeping validation (debits = credits)
 * - Support for 9 journal types
 * - Cost center and project tracking
 */
@ObjectType('JournalEntry')
export class JournalEntryDto {
  @Field(() => ID)
  id!: string;

  @Field()
  journalNumber!: string;

  @Field()
  journalDate!: Date;

  @Field(() => JournalType)
  journalType!: JournalType;

  @Field()
  description!: string;

  @Field({ nullable: true })
  reference?: string;

  @Field(() => [JournalLineDto])
  lines!: JournalLineDto[];

  @Field()
  totalDebit!: number;

  @Field()
  totalCredit!: number;

  @Field()
  currency!: string;

  @Field(() => JournalStatus)
  status!: JournalStatus;

  @Field()
  fiscalPeriod!: string;

  @Field()
  isReversing!: boolean;

  @Field(() => ID, { nullable: true })
  originalJournalId?: string;

  @Field({ nullable: true })
  postedAt?: Date;

  @Field(() => ID, { nullable: true })
  postedBy?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
