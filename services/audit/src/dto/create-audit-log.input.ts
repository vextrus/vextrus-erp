import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { AuditEventType, AuditSeverity, AuditOutcome } from '../entities/audit-log.entity';

@InputType()
export class CreateAuditLogInput {
  @Field()
  @IsString()
  tenant_id: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  user_id?: string;

  @Field()
  @IsString()
  action: string;

  @Field()
  @IsString()
  entity_type: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  entity_id?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  old_values?: any;

  @Field(() => String, { nullable: true })
  @IsOptional()
  new_values?: any;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  ip_address?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  user_agent?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  metadata?: any;

  @Field(() => AuditEventType, { nullable: true })
  @IsEnum(AuditEventType)
  @IsOptional()
  event_type?: AuditEventType;

  @Field(() => AuditSeverity, { nullable: true })
  @IsEnum(AuditSeverity)
  @IsOptional()
  severity?: AuditSeverity;

  @Field(() => AuditOutcome, { nullable: true })
  @IsEnum(AuditOutcome)
  @IsOptional()
  outcome?: AuditOutcome;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  service_name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  request_id?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  session_id?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  correlation_id?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  method?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  path?: string;

  @Field({ nullable: true })
  @IsOptional()
  status_code?: number;

  @Field({ nullable: true })
  @IsOptional()
  duration?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  error_message?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  username?: string;

  @Field()
  @IsBoolean()
  @IsOptional()
  is_sensitive?: boolean;
}