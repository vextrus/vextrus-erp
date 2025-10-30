import { InputType, Field, Float } from '@nestjs/graphql';
import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, IsArray, ValidateNested, Min, IsDateString, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { VATCategory } from '../dto/enums.dto';

@InputType()
export class LineItemInput {
  @Field()
  @IsString()
  description!: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @Field()
  @IsString()
  @Length(3, 3)
  currency!: string;

  @Field(() => VATCategory, { nullable: true })
  @IsEnum(VATCategory)
  @IsOptional()
  vatCategory?: VATCategory;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  hsCode?: string;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  supplementaryDutyRate?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  advanceIncomeTaxRate?: number;
}

@InputType()
export class CreateInvoiceInput {
  @Field()
  @IsUUID()
  vendorId!: string;

  @Field()
  @IsUUID()
  customerId!: string;

  @Field()
  @IsDateString()
  invoiceDate!: string;

  @Field()
  @IsDateString()
  dueDate!: string;

  @Field(() => [LineItemInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemInput)
  lineItems!: LineItemInput[];

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
