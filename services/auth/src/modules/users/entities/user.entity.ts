import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';
import { UserRole } from '../../rbac/entities/user-role.entity';

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('users', { schema: 'auth' })
@Index(['email', 'organizationId'], { unique: true })
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column('uuid')
  @Index()
  organizationId!: string;

  @Field()
  @Column({ unique: true })
  @Index()
  email!: string;

  @Field()
  @Column({ unique: true })
  username!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true, name: 'first_name_bn' })
  firstNameBn?: string;

  @Column({ nullable: true, name: 'last_name_bn' })
  lastNameBn?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  phone?: string;

  @Field()
  @Column({ default: false })
  phoneVerified!: boolean;

  @Field()
  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ default: false })
  mfaEnabled!: boolean;

  @Column({ nullable: true })
  mfaSecret?: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'inet', nullable: true })
  lastLoginIp?: string;

  @Column({ type: 'timestamptz', nullable: true })
  passwordChangedAt?: Date;

  @Column({ default: 0 })
  failedLoginAttempts!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil?: Date;

  @Field()
  @Column({ default: 'ACTIVE' })
  status!: string;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column('uuid', { nullable: true })
  createdBy?: string;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column('uuid', { nullable: true })
  updatedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @Column({ default: 1 })
  version!: number;

  @Column('uuid', { nullable: true })
  roleId?: string;

  // GAP-001B Fix: Relationship to user roles for permissions lookup
  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles?: UserRole[];

  @Column({ type: 'timestamptz', nullable: true })
  lockedAt?: Date;

  @Column({ nullable: true, default: 'en' })
  preferredLanguage?: string;

  get password(): string {
    return this.passwordHash;
  }

  set password(value: string) {
    this.passwordHash = value;
  }

  get phoneNumber(): string | undefined {
    return this.phone;
  }

  set phoneNumber(value: string | undefined) {
    if (value !== undefined) {
      this.phone = value;
    }
  }

  get isLocked(): boolean {
    return this.lockedUntil != null && this.lockedUntil > new Date();
  }

  set isLocked(value: boolean) {
    if (value) {
      this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      this.lockedAt = new Date();
    } else {
      delete (this as any).lockedUntil;
      delete (this as any).lockedAt;
    }
  }

  get isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  set isActive(value: boolean) {
    this.status = value ? 'ACTIVE' : 'INACTIVE';
  }
}