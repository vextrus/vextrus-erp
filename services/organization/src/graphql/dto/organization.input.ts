import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsEmail, IsUrl, IsEnum } from 'class-validator';

@InputType()
export class CreateOrganizationInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  slug: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @IsEnum(['construction', 'real-estate', 'both'])
  type?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  phone?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @IsUrl()
  website?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  tin?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  bin?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @IsEnum(['basic', 'professional', 'enterprise'])
  subscriptionPlan?: string;
}

@InputType()
export class UpdateOrganizationInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  phone?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @IsUrl()
  website?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  logoUrl?: string;
}

@InputType()
export class OrganizationFilterInput {
  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  type?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  subscriptionPlan?: string;
}
