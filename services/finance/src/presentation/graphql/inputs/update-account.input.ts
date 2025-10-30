import { InputType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * Update Account GraphQL Input
 *
 * GraphQL input type for updating existing chart of accounts.
 * All fields are optional - only provided fields will be updated.
 * Only ACTIVE accounts can be updated.
 *
 * Business Rules:
 * - Only ACTIVE accounts can be updated
 * - INACTIVE accounts are immutable
 * - accountCode, accountType, and currency are IMMUTABLE (accounting integrity)
 * - Only accountName and parentAccountId can be updated
 *
 * Bangladesh Compliance:
 * - Maintains account hierarchy integrity
 * - Preserves account code structure for reporting
 */
@InputType()
export class UpdateAccountInput {
  @Field({ nullable: true, description: 'Updated account name (description)' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  accountName?: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Updated parent account ID (null to remove parent, undefined to keep current)'
  })
  @IsOptional()
  @IsString()
  parentAccountId?: string | null;
}
