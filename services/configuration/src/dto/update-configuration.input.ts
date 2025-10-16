import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsJSON, IsUUID } from 'class-validator';

@InputType()
export class UpdateConfigurationInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  key?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  value?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  type?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  tenant_id?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  environment?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  is_encrypted?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsJSON()
  metadata?: Record<string, any>;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsJSON()
  validation_rules?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  updated_by?: string;
}