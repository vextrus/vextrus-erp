import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { Field, ObjectType, ID, registerEnumType } from '@nestjs/graphql';
import { Directive } from '@nestjs/graphql';

export enum AuditEventType {
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  USER_CREATE = 'user_create',
  USER_UPDATE = 'user_update',
  USER_DELETE = 'user_delete',
  USER_ROLE_CHANGE = 'user_role_change',
  DATA_ACCESS = 'data_access',
  DATA_CREATE = 'data_create',
  DATA_UPDATE = 'data_update',
  DATA_DELETE = 'data_delete',
  DATA_EXPORT = 'data_export',
  DATA_READ = 'data_read',
  FILE_UPLOAD = 'file_upload',
  FILE_DOWNLOAD = 'file_download',
  FILE_DELETE = 'file_delete',
  FILE_SHARE = 'file_share',
  PERMISSION_CHANGE = 'permission_change',
  SYSTEM_CONFIG = 'system_config',
  SYSTEM_CONFIG_CHANGE = 'system_config_change',
  SECURITY_EVENT = 'security_event',
  SECURITY_SUSPICIOUS_ACTIVITY = 'security_suspicious_activity',
  SECURITY_ACCESS_DENIED = 'security_access_denied',
  SECURITY_BRUTE_FORCE = 'security_brute_force',
  AUTH_LOGIN = 'auth_login',
  AUTH_LOGOUT = 'auth_logout',
  AUTH_FAILED = 'auth_failed',
  AUTH_MFA_ENABLED = 'auth_mfa_enabled',
  AUTH_MFA_DISABLED = 'auth_mfa_disabled',
  AUTH_PASSWORD_CHANGE = 'auth_password_change',
  COMPLIANCE_DATA_DELETION = 'compliance_data_deletion',
  COMPLIANCE_DATA_ACCESS = 'compliance_data_access',
  COMPLIANCE_CONSENT_GIVEN = 'compliance_consent_given',
  COMPLIANCE_CONSENT_WITHDRAWN = 'compliance_consent_withdrawn',
  BUSINESS_TRANSACTION = 'business_transaction',
}

export enum AuditSeverity {
  INFO = 'info',
  LOW = 'low',
  WARNING = 'warning',
  MEDIUM = 'medium',
  ERROR = 'error',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AuditOutcome {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial',
  PENDING = 'pending',
}

// Register enums for GraphQL
registerEnumType(AuditEventType, {
  name: 'AuditEventType',
  description: 'Type of audit event',
});

registerEnumType(AuditSeverity, {
  name: 'AuditSeverity',
  description: 'Severity level of audit event',
});

registerEnumType(AuditOutcome, {
  name: 'AuditOutcome',
  description: 'Outcome of the audited action',
});

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('audit_logs')
@Index(['tenant_id', 'created_at'])
@Index(['user_id', 'created_at'])
export class AuditLog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  tenant_id: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  user_id: string;

  @Field()
  @Column()
  action: string;

  @Field()
  @Column()
  entity_type: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  entity_id: string;

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  old_values: any;

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  new_values: any;

  @Field({ nullable: true })
  @Column({ nullable: true })
  ip_address: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  user_agent: string;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  metadata: any;

  @Field(() => AuditEventType, { nullable: true })
  @Column({ nullable: true })
  event_type: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  signature: string;

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  compliance_info: any;

  @Field(() => AuditSeverity, { nullable: true })
  @Column({ nullable: true })
  severity: string;

  @Field()
  @Column({ default: false })
  is_sensitive: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  request_id: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  session_id: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  correlation_id: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  method: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  path: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  status_code: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  duration: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  error_message: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  stack_trace: string;

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  request_body: any;

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  response_body: any;

  @Field({ nullable: true })
  @Column({ nullable: true })
  service_name: string;

  @Field(() => AuditOutcome, { nullable: true })
  @Column({ nullable: true })
  outcome: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  timestamp: Date;

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  headers: any;

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  device_info: any;

  @Field({ nullable: true })
  @Column({ nullable: true })
  username: string;

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  location: {
    ip?: string;
    city?: string;
    country?: string;
  };

  @Field()
  @Column({ default: false })
  is_archived: boolean;
}
