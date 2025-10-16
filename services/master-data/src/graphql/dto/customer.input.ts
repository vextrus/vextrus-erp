import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsEmail, IsOptional, IsNumber, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class AddressInput {
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
export class PaymentTermsInput {
  @Field()
  days: number;

  @Field({ nullable: true })
  description?: string;
}

@InputType()
export class CreateCustomerInput {
  @Field()
  code: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  nameInBengali?: string;

  @Field({ nullable: true })
  tin?: string;

  @Field({ nullable: true })
  nid?: string;

  @Field()
  phone: string;

  @Field()
  email: string;

  @Field(() => AddressInput)
  address: AddressInput;

  @Field()
  creditLimit: number;

  @Field(() => PaymentTermsInput)
  paymentTerms: PaymentTermsInput;

  // TODO: Add metadata field with proper GraphQL JSON scalar type
  // @Field(() => GraphQLJSONObject, { nullable: true })
  // metadata?: Record<string, any>;
}

@InputType()
export class UpdateCustomerInput {
  @Field({ nullable: true })
  code?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  nameInBengali?: string;

  @Field({ nullable: true })
  tin?: string;

  @Field({ nullable: true })
  nid?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  email?: string;

  @Field(() => AddressInput, { nullable: true })
  address?: AddressInput;

  @Field({ nullable: true })
  creditLimit?: number;

  @Field(() => PaymentTermsInput, { nullable: true })
  paymentTerms?: PaymentTermsInput;

  // TODO: Add metadata field with proper GraphQL JSON scalar type
  // @Field(() => GraphQLJSONObject, { nullable: true })
  // metadata?: Record<string, any>;
}

@InputType()
export class CustomerFilterInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  code?: string;

  @Field({ nullable: true })
  tin?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  email?: string;
}