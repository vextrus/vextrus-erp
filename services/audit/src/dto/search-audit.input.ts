import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { AuditEventType, AuditSeverity, AuditOutcome } from '../entities/audit-log.entity';

@InputType()
export class SearchAuditInput {
  @Field()
  @IsString()
  tenant_id: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  user_id?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  entity_type?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  entity_id?: string;

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
  action?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  correlation_id?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  request_id?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  session_id?: string;

  @Field(() => Number, { nullable: true, defaultValue: 100 })
  @IsOptional()
  limit?: number;

  @Field(() => Number, { nullable: true, defaultValue: 0 })
  @IsOptional()
  offset?: number;
}