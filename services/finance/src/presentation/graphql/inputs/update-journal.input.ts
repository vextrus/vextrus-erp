import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, IsDateString, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { JournalLineInput } from './journal-line.input';

/**
 * Update Journal Entry GraphQL Input
 *
 * GraphQL input type for updating existing journal entries.
 * All fields are optional - only provided fields will be updated.
 * Only DRAFT journals can be updated.
 *
 * Business Rules:
 * - Only DRAFT status journals can be updated
 * - POSTED, REVERSED, or CANCELLED journals are immutable
 * - Journal must remain balanced (debits = credits) after update
 * - Fiscal period recalculated automatically if journalDate changes
 *
 * Bangladesh Compliance:
 * - Fiscal year validation (July-June)
 * - Double-entry bookkeeping rules enforced
 * - Journal balance validation (debits must equal credits)
 */
@InputType()
export class UpdateJournalInput {
  @Field({ nullable: true, description: 'Updated journal description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field({ nullable: true, description: 'Updated journal reference number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @Field({ nullable: true, description: 'Updated journal date (triggers fiscal period recalculation)' })
  @IsOptional()
  @IsDateString()
  journalDate?: string;

  @Field(() => [JournalLineInput], {
    nullable: true,
    description: 'Updated journal lines (replaces all existing lines). Must balance (debits = credits).'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineInput)
  lines?: JournalLineInput[];
}
