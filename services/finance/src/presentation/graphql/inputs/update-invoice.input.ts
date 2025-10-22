import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsUUID, IsArray, ValidateNested, IsOptional, IsDateString, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { LineItemInput } from './create-invoice.input';

/**
 * Update Invoice GraphQL Input
 *
 * All fields are optional to support partial updates.
 * Only DRAFT invoices can be updated.
 *
 * Bangladesh Compliance:
 * - TIN must be 10 digits
 * - BIN must be 9 digits
 * - Fiscal year auto-calculated from invoice date
 */
@InputType()
export class UpdateInvoiceInput {
  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  vendorId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  invoiceDate?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @Field(() => [LineItemInput], { nullable: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemInput)
  @IsOptional()
  lineItems?: LineItemInput[];

  @Field({ nullable: true })
  @IsString()
  @Length(10, 10)
  @IsOptional()
  vendorTIN?: string;

  @Field({ nullable: true })
  @IsString()
  @Length(9, 9)
  @IsOptional()
  vendorBIN?: string;

  @Field({ nullable: true })
  @IsString()
  @Length(10, 10)
  @IsOptional()
  customerTIN?: string;

  @Field({ nullable: true })
  @IsString()
  @Length(9, 9)
  @IsOptional()
  customerBIN?: string;
}
