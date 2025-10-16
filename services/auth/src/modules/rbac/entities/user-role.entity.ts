import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from './role.entity';

@Entity('user_roles', { schema: 'auth' })
@Index(['userId', 'roleId'], { unique: true })
@Index(['organizationId'])
@Index(['expiresAt'])
export class UserRole {
  @PrimaryColumn('uuid')
  userId!: string;

  @PrimaryColumn('uuid')
  roleId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column('uuid')
  organizationId!: string;

  @Column('uuid', { nullable: true })
  assignedBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_by' })
  assignedByUser?: User;

  @CreateDateColumn({ type: 'timestamptz' })
  assignedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ default: true })
  isActive!: boolean;

  @Column('text', { nullable: true })
  reason?: string; // Reason for role assignment

  @Column('jsonb', { nullable: true })
  scope?: {
    projects?: string[]; // Specific project IDs
    departments?: string[]; // Specific departments
    locations?: string[]; // Specific locations/sites
    temporaryDelegation?: {
      fromUserId?: string;
      reason?: string;
      originalRoleId?: string;
    };
  };

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt?: Date;

  @Column('uuid', { nullable: true })
  revokedBy?: string;

  @Column('text', { nullable: true })
  revocationReason?: string;
}