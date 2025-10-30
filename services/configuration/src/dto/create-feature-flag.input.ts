import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsJSON, IsUUID } from 'class-validator';

@InputType()
export class CreateFeatureFlagInput {
  @Field()
  @IsString()
  key: string;

  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  tenant_id?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsJSON()
  rules?: {
    percentage?: number;
    userGroups?: string[];
    startDate?: Date;
    endDate?: Date;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsJSON()
  metadata?: Record<string, any>;
}