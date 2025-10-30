import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsDate, Matches } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Get Trial Balance GraphQL Input
 *
 * Input for querying trial balance report.
 * Validates fiscal year format and optional as-of date.
 *
 * Bangladesh Fiscal Year Format:
 * - "FY2024-2025": July 1, 2024 → June 30, 2025
 * - Regex: /^FY\d{4}-\d{4}$/
 */
@InputType()
export class GetTrialBalanceInput {
  /**
   * Fiscal year in format "FY2024-2025"
   * Represents Bangladesh fiscal year (July-June)
   */
  @Field(() => String, {
    description: 'Fiscal year (e.g., "FY2024-2025" for July 2024 - June 2025)',
  })
  @IsString()
  @Matches(/^FY\d{4}-\d{4}$/, {
    message: 'Fiscal year must be in format "FY2024-2025"',
  })
  fiscalYear!: string;

  /**
   * Optional: Calculate balance as of specific date
   * Defaults to current date if not provided
   */
  @Field(() => Date, {
    nullable: true,
    description: 'Calculate balance as of this date (defaults to current date)',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  asOfDate?: Date;
}
