import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  Index,
} from 'typeorm';
import { Permission } from './permission.entity';

@Entity('roles', { schema: 'auth' })
@Index(['name', 'organizationId'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  @Index()
  name!: string;

  @Column({ length: 100 })
  nameEn!: string; // English name

  @Column({ length: 100 })
  nameBn!: string; // Bengali name

  @Column('text')
  description!: string;

  @Column('text', { nullable: true })
  descriptionBn?: string; // Bengali description

  @Column('uuid')
  @Index()
  organizationId!: string;

  @Column('uuid', { nullable: true })
  parentRoleId?: string;

  @ManyToOne(() => Role, role => role.childRoles, { nullable: true })
  parentRole?: Role;

  @OneToMany(() => Role, role => role.parentRole)
  childRoles?: Role[];

  @Column('int', { default: 0 })
  level!: number; // Hierarchy level (0 = top level)

  @Column('jsonb', { default: [] })
  permissions!: string[]; // Direct permission keys

  @ManyToMany(() => Permission, permission => permission.roles)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissionEntities?: Permission[];

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isSystem!: boolean; // System roles cannot be deleted

  @Column({ default: false })
  isDefault!: boolean; // Default role for new users

  @Column('int', { default: 0 })
  priority!: number; // For role precedence

  @Column('jsonb', { nullable: true })
  metadata?: {
    maxProjects?: number;
    maxUsers?: number;
    allowedModules?: string[];
    restrictions?: Record<string, any>;
  };

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column('uuid', { nullable: true })
  createdBy?: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column('uuid', { nullable: true })
  updatedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @Column({ default: 1 })
  version!: number;
}