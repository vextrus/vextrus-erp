import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  Index,
} from 'typeorm';
import { Role } from './role.entity';

export enum PermissionCategory {
  PROJECT_MANAGEMENT = 'project_management',
  FINANCIAL_MANAGEMENT = 'financial_management',
  DOCUMENT_MANAGEMENT = 'document_management',
  COMPLIANCE_MANAGEMENT = 'compliance_management',
  RESOURCE_MANAGEMENT = 'resource_management',
  USER_MANAGEMENT = 'user_management',
  SYSTEM_ADMINISTRATION = 'system_administration',
  REPORTING = 'reporting',
  AUDIT = 'audit',
}

export enum ResourceType {
  PROJECT = 'project',
  FINANCE = 'finance',
  DOCUMENT = 'document',
  USER = 'user',
  ROLE = 'role',
  ORGANIZATION = 'organization',
  COMPLIANCE = 'compliance',
  RESOURCE = 'resource',
  REPORT = 'report',
  AUDIT = 'audit',
  SYSTEM = 'system',
}

export enum ActionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUBMIT = 'submit',
  ARCHIVE = 'archive',
  RESTORE = 'restore',
  EXPORT = 'export',
  IMPORT = 'import',
  SHARE = 'share',
  ASSIGN = 'assign',
  EXECUTE = 'execute',
  MANAGE = 'manage',
}

@Entity('permissions', { schema: 'auth' })
@Index(['key'], { unique: true })
@Index(['resource', 'action'])
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100, unique: true })
  key!: string; // e.g., 'project.create', 'finance.approve'

  @Column({
    type: 'enum',
    enum: ResourceType,
  })
  resource!: ResourceType;

  @Column({
    type: 'enum',
    enum: ActionType,
  })
  action!: ActionType;

  @Column('text')
  description!: string;

  @Column('text')
  descriptionBn!: string; // Bengali description

  @Column({
    type: 'enum',
    enum: PermissionCategory,
  })
  category!: PermissionCategory;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isSystem!: boolean; // System permissions cannot be modified

  @Column({ default: false })
  requiresMfa!: boolean; // Requires multi-factor authentication

  @Column({ default: false })
  requiresApproval!: boolean; // Requires approval workflow

  @Column('jsonb', { nullable: true })
  conditions?: {
    timeRestriction?: {
      startTime?: string; // e.g., "09:00"
      endTime?: string; // e.g., "18:00"
      weekdays?: number[]; // 0-6 (Sunday-Saturday)
    };
    ipRestriction?: {
      allowedIps?: string[];
      blockedIps?: string[];
    };
    contextual?: {
      maxAmount?: number; // For financial permissions
      projectTypes?: string[]; // For project permissions
      documentTypes?: string[]; // For document permissions
    };
  };

  @Column('jsonb', { nullable: true })
  metadata?: {
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    auditRequired?: boolean;
    notificationRequired?: boolean;
    bangladeshSpecific?: {
      rajukCompliance?: boolean;
      nbrCompliance?: boolean;
      vatApplicable?: boolean;
      aitApplicable?: boolean;
    };
  };

  @ManyToMany(() => Role, role => role.permissionEntities)
  roles?: Role[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ default: 1 })
  version!: number;
}