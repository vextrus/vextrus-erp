import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsString, IsEmail, IsOptional, IsPhoneNumber, IsEnum, IsBoolean } from 'class-validator';

@InputType()
class VendorAddressInput {
  @Field()
  street1: string;

  @Field({ nullable: true })
  street2?: string;

  @Field()
  city: string;

  @Field()
  district: string;

  @Field()
  division: string;

  @Field()
  postalCode: string;

  @Field({ defaultValue: 'Bangladesh' })
  country?: string;
}

@InputType()
export class CreateVendorInput {
  @Field()
  @IsString()
  code: string;

  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  nameBn?: string;

  @Field()
  @IsString()
  type: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  tin?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  bin?: string;

  @Field({ nullable: true })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field({ nullable: true })
  @IsPhoneNumber('BD')
  @IsOptional()
  phone?: string;

  @Field({ nullable: true })
  @IsPhoneNumber('BD')
  @IsOptional()
  mobile?: string;

  @Field(() => VendorAddressInput)
  address: VendorAddressInput;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  contactPersonPhone?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  website?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  bankName?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  bankBranch?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  bankAccountNo?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  bankRoutingNo?: string;

  @Field({ defaultValue: 30 })
  paymentTerms?: number;

  @Field({ defaultValue: 0 })
  creditLimit?: number;

  @Field({ defaultValue: true })
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class UpdateVendorInput extends PartialType(CreateVendorInput) {}

@InputType()
export class VendorFilterInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  search?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  type?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  division?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  district?: string;
}